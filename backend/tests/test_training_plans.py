"""
Test suite for Weekly Training Planner (Training Plans) API
Tests CRUD operations for /api/training-plans endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COACH_EMAIL = "carlos@academy.com"
COACH_PASSWORD = "coach123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for coach user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": COACH_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def team_id(auth_headers):
    """Get first team ID for testing"""
    response = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
    assert response.status_code == 200, f"Failed to get teams: {response.text}"
    teams = response.json()
    assert len(teams) > 0, "No teams found for testing"
    return teams[0]["id"]


@pytest.fixture(scope="module")
def drills(auth_headers):
    """Get available drills for testing"""
    response = requests.get(f"{BASE_URL}/api/drills", headers=auth_headers)
    assert response.status_code == 200, f"Failed to get drills: {response.text}"
    drills_list = response.json()
    assert len(drills_list) > 0, "No drills found for testing"
    return drills_list[:5]  # Return first 5 drills


def get_week_start():
    """Get Monday of current week as YYYY-MM-DD"""
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    return monday.strftime("%Y-%m-%d")


class TestTrainingPlansAPI:
    """Test Training Plans CRUD endpoints"""
    
    created_plan_id = None
    
    def test_01_get_training_plans_empty(self, auth_headers, team_id):
        """GET /api/training-plans returns list (may be empty initially)"""
        week_start = get_week_start()
        response = requests.get(
            f"{BASE_URL}/api/training-plans?team_id={team_id}&week_start={week_start}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} existing plans for team {team_id}, week {week_start}")
    
    def test_02_create_training_plan(self, auth_headers, team_id, drills):
        """POST /api/training-plans creates a new plan"""
        week_start = get_week_start()
        
        # Build days array with drills
        days = [[], [], [], [], [], [], []]  # Mon-Sun
        
        # Add drills to Monday (index 0)
        if len(drills) >= 2:
            days[0] = [
                {
                    "drill_id": drills[0]["id"],
                    "name": drills[0]["name"],
                    "category": drills[0]["category"],
                    "duration_minutes": drills[0]["duration_minutes"],
                    "difficulty": drills[0]["difficulty"]
                },
                {
                    "drill_id": drills[1]["id"],
                    "name": drills[1]["name"],
                    "category": drills[1]["category"],
                    "duration_minutes": drills[1]["duration_minutes"],
                    "difficulty": drills[1]["difficulty"]
                }
            ]
        
        # Add drill to Wednesday (index 2)
        if len(drills) >= 3:
            days[2] = [
                {
                    "drill_id": drills[2]["id"],
                    "name": drills[2]["name"],
                    "category": drills[2]["category"],
                    "duration_minutes": drills[2]["duration_minutes"],
                    "difficulty": drills[2]["difficulty"]
                }
            ]
        
        payload = {
            "team_id": team_id,
            "week_start": week_start,
            "name": "TEST_Weekly_Plan_Iteration12",
            "days": days
        }
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed to create plan: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain plan ID"
        assert data["team_id"] == team_id, "Team ID mismatch"
        assert data["week_start"] == week_start, "Week start mismatch"
        assert data["name"] == "TEST_Weekly_Plan_Iteration12", "Plan name mismatch"
        assert len(data["days"]) == 7, "Days array should have 7 elements"
        assert len(data["days"][0]) == 2, "Monday should have 2 drills"
        assert len(data["days"][2]) == 1, "Wednesday should have 1 drill"
        
        TestTrainingPlansAPI.created_plan_id = data["id"]
        print(f"Created plan with ID: {data['id']}")
    
    def test_03_get_training_plan_by_id(self, auth_headers):
        """GET /api/training-plans/{plan_id} returns single plan"""
        plan_id = TestTrainingPlansAPI.created_plan_id
        assert plan_id is not None, "No plan ID from previous test"
        
        response = requests.get(
            f"{BASE_URL}/api/training-plans/{plan_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["id"] == plan_id, "Plan ID mismatch"
        assert data["name"] == "TEST_Weekly_Plan_Iteration12", "Plan name mismatch"
        assert len(data["days"]) == 7, "Days array should have 7 elements"
        print(f"Retrieved plan: {data['name']}")
    
    def test_04_get_training_plans_with_filters(self, auth_headers, team_id):
        """GET /api/training-plans with team_id and week_start filters"""
        week_start = get_week_start()
        
        response = requests.get(
            f"{BASE_URL}/api/training-plans?team_id={team_id}&week_start={week_start}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 1, "Should have at least 1 plan after creation"
        
        # Find our created plan
        found = False
        for plan in data:
            if plan.get("name") == "TEST_Weekly_Plan_Iteration12":
                found = True
                break
        assert found, "Created plan not found in filtered results"
        print(f"Found {len(data)} plans for team {team_id}, week {week_start}")
    
    def test_05_update_training_plan(self, auth_headers, drills):
        """PUT /api/training-plans/{plan_id} updates a plan"""
        plan_id = TestTrainingPlansAPI.created_plan_id
        assert plan_id is not None, "No plan ID from previous test"
        
        # Update with new name and add drill to Friday
        days = [[], [], [], [], [], [], []]
        
        # Keep Monday drills
        if len(drills) >= 2:
            days[0] = [
                {
                    "drill_id": drills[0]["id"],
                    "name": drills[0]["name"],
                    "category": drills[0]["category"],
                    "duration_minutes": drills[0]["duration_minutes"],
                    "difficulty": drills[0]["difficulty"]
                }
            ]
        
        # Add drill to Friday (index 4)
        if len(drills) >= 4:
            days[4] = [
                {
                    "drill_id": drills[3]["id"],
                    "name": drills[3]["name"],
                    "category": drills[3]["category"],
                    "duration_minutes": drills[3]["duration_minutes"],
                    "difficulty": drills[3]["difficulty"]
                }
            ]
        
        payload = {
            "name": "TEST_Updated_Weekly_Plan",
            "days": days
        }
        
        response = requests.put(
            f"{BASE_URL}/api/training-plans/{plan_id}",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed to update plan: {response.text}"
        
        data = response.json()
        assert data.get("status") == "updated", "Update status mismatch"
        print(f"Updated plan {plan_id}")
        
        # Verify update by fetching
        response = requests.get(
            f"{BASE_URL}/api/training-plans/{plan_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to fetch updated plan: {response.text}"
        
        updated_plan = response.json()
        assert updated_plan["name"] == "TEST_Updated_Weekly_Plan", "Name not updated"
        assert len(updated_plan["days"][0]) == 1, "Monday should have 1 drill after update"
        assert len(updated_plan["days"][4]) == 1, "Friday should have 1 drill after update"
        print(f"Verified update: name={updated_plan['name']}")
    
    def test_06_get_nonexistent_plan(self, auth_headers):
        """GET /api/training-plans/{invalid_id} returns 404"""
        fake_id = "000000000000000000000000"
        response = requests.get(
            f"{BASE_URL}/api/training-plans/{fake_id}",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for non-existent plan")
    
    def test_07_delete_training_plan(self, auth_headers):
        """DELETE /api/training-plans/{plan_id} deletes a plan"""
        plan_id = TestTrainingPlansAPI.created_plan_id
        assert plan_id is not None, "No plan ID from previous test"
        
        response = requests.delete(
            f"{BASE_URL}/api/training-plans/{plan_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to delete plan: {response.text}"
        
        data = response.json()
        assert data.get("status") == "deleted", "Delete status mismatch"
        print(f"Deleted plan {plan_id}")
        
        # Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/training-plans/{plan_id}",
            headers=auth_headers
        )
        assert response.status_code == 404, "Plan should not exist after deletion"
        print("Verified plan no longer exists")
    
    def test_08_create_plan_for_persistence_test(self, auth_headers, team_id, drills):
        """Create a plan that will be used for frontend persistence testing"""
        week_start = get_week_start()
        
        days = [[], [], [], [], [], [], []]
        
        # Add drills to multiple days for frontend testing
        if len(drills) >= 3:
            days[0] = [{
                "drill_id": drills[0]["id"],
                "name": drills[0]["name"],
                "category": drills[0]["category"],
                "duration_minutes": drills[0]["duration_minutes"],
                "difficulty": drills[0]["difficulty"]
            }]
            days[2] = [{
                "drill_id": drills[1]["id"],
                "name": drills[1]["name"],
                "category": drills[1]["category"],
                "duration_minutes": drills[1]["duration_minutes"],
                "difficulty": drills[1]["difficulty"]
            }]
            days[4] = [{
                "drill_id": drills[2]["id"],
                "name": drills[2]["name"],
                "category": drills[2]["category"],
                "duration_minutes": drills[2]["duration_minutes"],
                "difficulty": drills[2]["difficulty"]
            }]
        
        payload = {
            "team_id": team_id,
            "week_start": week_start,
            "name": "TEST_Persistence_Plan",
            "days": days
        }
        
        response = requests.post(
            f"{BASE_URL}/api/training-plans",
            headers=auth_headers,
            json=payload
        )
        assert response.status_code == 200, f"Failed to create plan: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain plan ID"
        TestTrainingPlansAPI.created_plan_id = data["id"]
        print(f"Created persistence test plan with ID: {data['id']}")


class TestTrainingPlansDataValidation:
    """Test data validation for training plans"""
    
    def test_plan_structure(self, auth_headers, team_id):
        """Verify plan response structure"""
        week_start = get_week_start()
        
        response = requests.get(
            f"{BASE_URL}/api/training-plans?team_id={team_id}&week_start={week_start}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        plans = response.json()
        if len(plans) > 0:
            plan = plans[0]
            # Check required fields
            assert "id" in plan, "Plan should have id"
            assert "team_id" in plan, "Plan should have team_id"
            assert "week_start" in plan, "Plan should have week_start"
            assert "days" in plan, "Plan should have days array"
            assert isinstance(plan["days"], list), "Days should be a list"
            assert len(plan["days"]) == 7, "Days should have 7 elements"
            print(f"Plan structure validated: {plan.get('name', 'unnamed')}")
    
    def test_drill_in_plan_structure(self, auth_headers, team_id):
        """Verify drill structure within plan days"""
        week_start = get_week_start()
        
        response = requests.get(
            f"{BASE_URL}/api/training-plans?team_id={team_id}&week_start={week_start}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        plans = response.json()
        for plan in plans:
            for day_idx, day_drills in enumerate(plan.get("days", [])):
                for drill in day_drills:
                    # Check drill fields
                    assert "drill_id" in drill or "id" in drill, f"Drill should have drill_id or id"
                    assert "name" in drill, "Drill should have name"
                    assert "category" in drill, "Drill should have category"
                    assert "duration_minutes" in drill, "Drill should have duration_minutes"
        print("Drill structure in plans validated")


class TestTrainingPlansCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_plans(self, auth_headers, team_id):
        """Delete all TEST_ prefixed plans"""
        response = requests.get(
            f"{BASE_URL}/api/training-plans?team_id={team_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        plans = response.json()
        deleted_count = 0
        for plan in plans:
            if plan.get("name", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/training-plans/{plan['id']}",
                    headers=auth_headers
                )
                if del_response.status_code == 200:
                    deleted_count += 1
        
        print(f"Cleaned up {deleted_count} test plans")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
