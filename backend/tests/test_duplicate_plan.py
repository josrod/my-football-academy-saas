"""
Test suite for Training Plan Duplicate feature
Tests POST /api/training-plans/{plan_id}/duplicate endpoint
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "carlos@academy.com"
TEST_PASSWORD = "coach123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for coach user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="module")
def teams(auth_headers):
    """Get available teams"""
    response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
    assert response.status_code == 200
    teams = response.json()
    assert len(teams) >= 1, "Need at least 1 team for testing"
    return teams


@pytest.fixture(scope="module")
def source_plan(auth_headers, teams):
    """Create a source plan with drills for duplication testing"""
    team_id = teams[0]["id"]
    # Use current week start
    today = datetime.now()
    day_of_week = today.weekday()
    week_start = (today - timedelta(days=day_of_week)).strftime("%Y-%m-%d")
    
    # Create plan with drills in days array
    plan_data = {
        "team_id": team_id,
        "week_start": week_start,
        "name": "TEST_Source Plan for Duplication",
        "days": [
            [{"drill_id": "drill1", "name": "Passing Drill", "category": "technical", "duration_minutes": 15}],
            [{"drill_id": "drill2", "name": "Shooting Drill", "category": "technical", "duration_minutes": 20}],
            [],
            [{"drill_id": "drill3", "name": "Fitness Run", "category": "physical", "duration_minutes": 30}],
            [],
            [],
            []
        ]
    }
    
    response = requests.post(f"{BASE_URL}/api/training-plans", json=plan_data, headers=auth_headers)
    assert response.status_code == 200, f"Failed to create source plan: {response.text}"
    plan = response.json()
    assert "id" in plan
    
    yield plan
    
    # Cleanup: delete source plan
    requests.delete(f"{BASE_URL}/api/training-plans/{plan['id']}", headers=auth_headers)


class TestDuplicatePlanEndpoint:
    """Tests for POST /api/training-plans/{plan_id}/duplicate"""
    
    def test_duplicate_plan_same_team_different_week(self, auth_headers, source_plan, teams):
        """Duplicate plan to same team but different week"""
        plan_id = source_plan["id"]
        
        # Target week: next week
        today = datetime.now()
        day_of_week = today.weekday()
        next_week_start = (today - timedelta(days=day_of_week) + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans/{plan_id}/duplicate",
            json={
                "target_team_id": source_plan["team_id"],
                "target_week_start": next_week_start
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Duplicate failed: {response.text}"
        dup_plan = response.json()
        
        # Verify duplicated plan structure
        assert "id" in dup_plan, "Duplicated plan should have id"
        assert dup_plan["id"] != source_plan["id"], "Duplicated plan should have different id"
        assert dup_plan["team_id"] == source_plan["team_id"], "Team should match target"
        assert dup_plan["week_start"] == next_week_start, "Week should match target"
        
        # Verify name has ' (copia)' suffix
        assert " (copia)" in dup_plan["name"], f"Name should have ' (copia)' suffix, got: {dup_plan['name']}"
        
        # Verify days array is preserved
        assert "days" in dup_plan, "Duplicated plan should have days"
        assert len(dup_plan["days"]) == 7, "Days should have 7 elements"
        
        # Verify drills are copied
        assert len(dup_plan["days"][0]) == 1, "Day 0 should have 1 drill"
        assert dup_plan["days"][0][0]["name"] == "Passing Drill"
        assert len(dup_plan["days"][1]) == 1, "Day 1 should have 1 drill"
        assert len(dup_plan["days"][3]) == 1, "Day 3 should have 1 drill"
        
        print(f"SUCCESS: Duplicated plan {plan_id} to {dup_plan['id']} for week {next_week_start}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/training-plans/{dup_plan['id']}", headers=auth_headers)
    
    def test_duplicate_plan_different_team(self, auth_headers, source_plan, teams):
        """Duplicate plan to a different team"""
        if len(teams) < 2:
            pytest.skip("Need at least 2 teams for this test")
        
        plan_id = source_plan["id"]
        target_team_id = teams[1]["id"]  # Different team
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans/{plan_id}/duplicate",
            json={
                "target_team_id": target_team_id,
                "target_week_start": source_plan["week_start"]
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Duplicate to different team failed: {response.text}"
        dup_plan = response.json()
        
        assert dup_plan["team_id"] == target_team_id, "Team should match target team"
        assert " (copia)" in dup_plan["name"]
        
        print(f"SUCCESS: Duplicated plan to different team {target_team_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/training-plans/{dup_plan['id']}", headers=auth_headers)
    
    def test_duplicate_plan_preserves_all_drills(self, auth_headers, source_plan):
        """Verify all drills in all days are preserved during duplication"""
        plan_id = source_plan["id"]
        
        # Target: 2 weeks from now
        today = datetime.now()
        day_of_week = today.weekday()
        target_week = (today - timedelta(days=day_of_week) + timedelta(days=14)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans/{plan_id}/duplicate",
            json={
                "target_team_id": source_plan["team_id"],
                "target_week_start": target_week
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        dup_plan = response.json()
        
        # Count total drills in source
        source_drill_count = sum(len(day) for day in source_plan["days"])
        dup_drill_count = sum(len(day) for day in dup_plan["days"])
        
        assert dup_drill_count == source_drill_count, f"Drill count mismatch: source={source_drill_count}, dup={dup_drill_count}"
        
        # Verify drill details are preserved
        for day_idx, (src_day, dup_day) in enumerate(zip(source_plan["days"], dup_plan["days"])):
            assert len(src_day) == len(dup_day), f"Day {day_idx} drill count mismatch"
            for drill_idx, (src_drill, dup_drill) in enumerate(zip(src_day, dup_day)):
                assert src_drill["name"] == dup_drill["name"], f"Drill name mismatch at day {day_idx}, drill {drill_idx}"
                assert src_drill["category"] == dup_drill["category"]
                assert src_drill["duration_minutes"] == dup_drill["duration_minutes"]
        
        print(f"SUCCESS: All {source_drill_count} drills preserved in duplication")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/training-plans/{dup_plan['id']}", headers=auth_headers)
    
    def test_duplicate_nonexistent_plan_returns_404(self, auth_headers):
        """Duplicate endpoint returns 404 for non-existent plan_id"""
        fake_plan_id = "000000000000000000000000"  # Valid ObjectId format but doesn't exist
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans/{fake_plan_id}/duplicate",
            json={
                "target_team_id": "some_team",
                "target_week_start": "2025-01-01"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent plan, got {response.status_code}"
        print("SUCCESS: 404 returned for non-existent plan_id")
    
    def test_duplicate_plan_name_suffix(self, auth_headers, source_plan):
        """Verify duplicated plan name has ' (copia)' suffix"""
        plan_id = source_plan["id"]
        
        today = datetime.now()
        day_of_week = today.weekday()
        target_week = (today - timedelta(days=day_of_week) + timedelta(days=21)).strftime("%Y-%m-%d")
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans/{plan_id}/duplicate",
            json={
                "target_team_id": source_plan["team_id"],
                "target_week_start": target_week
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        dup_plan = response.json()
        
        expected_name = source_plan["name"] + " (copia)"
        assert dup_plan["name"] == expected_name, f"Expected name '{expected_name}', got '{dup_plan['name']}'"
        
        print(f"SUCCESS: Name correctly suffixed: '{dup_plan['name']}'")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/training-plans/{dup_plan['id']}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
