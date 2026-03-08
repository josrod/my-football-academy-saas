"""
Test Season Leaderboard API - GET /api/seasons/{id}/leaderboard
Tests: top_scorers, top_assists, best_attendance, top_rated arrays
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@academy.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


@pytest.fixture(scope="module")
def active_season_id(api_client):
    """Get the active season ID"""
    response = api_client.get(f"{BASE_URL}/api/seasons")
    assert response.status_code == 200
    seasons = response.json()
    active = [s for s in seasons if s.get("status") == "active"]
    assert len(active) > 0, "No active season found"
    return active[0]["id"]


class TestLeaderboardAPI:
    """Tests for GET /api/seasons/{id}/leaderboard endpoint"""

    def test_leaderboard_returns_200(self, api_client, active_season_id):
        """Test leaderboard endpoint returns 200 OK"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Leaderboard endpoint returns 200 for season {active_season_id}")

    def test_leaderboard_has_required_fields(self, api_client, active_season_id):
        """Test leaderboard has all required top-level fields"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        required_fields = ["top_scorers", "top_assists", "best_attendance", "top_rated", 
                         "season_name", "total_matches", "total_training"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"✓ Leaderboard has all required fields: {required_fields}")

    def test_leaderboard_arrays_are_lists(self, api_client, active_season_id):
        """Test that leaderboard arrays are actually lists"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        assert isinstance(data["top_scorers"], list), "top_scorers should be a list"
        assert isinstance(data["top_assists"], list), "top_assists should be a list"
        assert isinstance(data["best_attendance"], list), "best_attendance should be a list"
        assert isinstance(data["top_rated"], list), "top_rated should be a list"
        print(f"✓ All leaderboard arrays are lists")

    def test_top_scorers_structure(self, api_client, active_season_id):
        """Test top_scorers entries have required player fields"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        if len(data["top_scorers"]) > 0:
            player = data["top_scorers"][0]
            required_fields = ["id", "first_name", "last_name", "jersey_number", "team_name", 
                             "category", "position", "goals"]
            for field in required_fields:
                assert field in player, f"Top scorer missing field: {field}"
            print(f"✓ Top scorers have all player info fields: {required_fields}")
            print(f"  Top scorer: {player['first_name']} {player['last_name']} - {player['goals']} goals")
        else:
            print("⚠ No top scorers data to validate structure")

    def test_top_scorers_sorted_descending(self, api_client, active_season_id):
        """Test top_scorers are sorted by goals descending"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        scorers = data["top_scorers"]
        if len(scorers) >= 2:
            for i in range(len(scorers) - 1):
                assert scorers[i]["goals"] >= scorers[i + 1]["goals"], \
                    f"Top scorers not sorted: {scorers[i]['goals']} < {scorers[i + 1]['goals']}"
            print(f"✓ Top scorers sorted by goals descending ({len(scorers)} players)")
        else:
            print(f"⚠ Not enough scorers to verify sort order ({len(scorers)} players)")

    def test_top_assists_structure(self, api_client, active_season_id):
        """Test top_assists entries have required fields"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        if len(data["top_assists"]) > 0:
            player = data["top_assists"][0]
            required_fields = ["id", "first_name", "last_name", "assists"]
            for field in required_fields:
                assert field in player, f"Top assist missing field: {field}"
            print(f"✓ Top assists have required fields")
            print(f"  Top assist: {player['first_name']} {player['last_name']} - {player['assists']} assists")
        else:
            print("⚠ No top assists data to validate structure")

    def test_top_assists_sorted_descending(self, api_client, active_season_id):
        """Test top_assists are sorted by assists descending"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        assists = data["top_assists"]
        if len(assists) >= 2:
            for i in range(len(assists) - 1):
                assert assists[i]["assists"] >= assists[i + 1]["assists"], \
                    f"Top assists not sorted: {assists[i]['assists']} < {assists[i + 1]['assists']}"
            print(f"✓ Top assists sorted by assists descending ({len(assists)} players)")
        else:
            print(f"⚠ Not enough assist data to verify sort order ({len(assists)} players)")

    def test_best_attendance_structure(self, api_client, active_season_id):
        """Test best_attendance entries have attendance rate fields"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        if len(data["best_attendance"]) > 0:
            player = data["best_attendance"][0]
            required_fields = ["id", "first_name", "last_name", "attendance_rate", 
                             "sessions_present", "sessions_total"]
            for field in required_fields:
                assert field in player, f"Best attendance missing field: {field}"
            # Verify attendance_rate is a percentage
            assert 0 <= player["attendance_rate"] <= 100, \
                f"attendance_rate should be 0-100, got {player['attendance_rate']}"
            print(f"✓ Best attendance has required fields including sessions_present/sessions_total")
            print(f"  Best attendance: {player['first_name']} {player['last_name']} - {player['attendance_rate']}%")
        else:
            print("⚠ No attendance data to validate structure")

    def test_best_attendance_sorted_descending(self, api_client, active_season_id):
        """Test best_attendance sorted by attendance_rate descending"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        attendance = data["best_attendance"]
        if len(attendance) >= 2:
            for i in range(len(attendance) - 1):
                assert attendance[i]["attendance_rate"] >= attendance[i + 1]["attendance_rate"], \
                    f"Best attendance not sorted: {attendance[i]['attendance_rate']} < {attendance[i + 1]['attendance_rate']}"
            print(f"✓ Best attendance sorted by rate descending ({len(attendance)} players)")
        else:
            print(f"⚠ Not enough attendance data to verify sort order ({len(attendance)} players)")

    def test_top_rated_structure(self, api_client, active_season_id):
        """Test top_rated entries have avg_rating field"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        if len(data["top_rated"]) > 0:
            player = data["top_rated"][0]
            required_fields = ["id", "first_name", "last_name", "avg_rating", "matches_played"]
            for field in required_fields:
                assert field in player, f"Top rated missing field: {field}"
            # Verify avg_rating is rounded to 1 decimal
            avg = player["avg_rating"]
            assert round(avg, 1) == avg, f"avg_rating should be rounded to 1 decimal, got {avg}"
            print(f"✓ Top rated has required fields with avg_rating rounded to 1 decimal")
            print(f"  Top rated: {player['first_name']} {player['last_name']} - rating {player['avg_rating']}")
        else:
            print("⚠ No rating data to validate structure")

    def test_top_rated_sorted_descending(self, api_client, active_season_id):
        """Test top_rated sorted by avg_rating descending"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        rated = data["top_rated"]
        if len(rated) >= 2:
            for i in range(len(rated) - 1):
                assert rated[i]["avg_rating"] >= rated[i + 1]["avg_rating"], \
                    f"Top rated not sorted: {rated[i]['avg_rating']} < {rated[i + 1]['avg_rating']}"
            print(f"✓ Top rated sorted by rating descending ({len(rated)} players)")
        else:
            print(f"⚠ Not enough rating data to verify sort order ({len(rated)} players)")

    def test_season_context_fields(self, api_client, active_season_id):
        """Test season context fields (season_name, total_matches, total_training)"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        assert data["season_name"], "season_name should not be empty"
        assert isinstance(data["total_matches"], int), "total_matches should be an integer"
        assert isinstance(data["total_training"], int), "total_training should be an integer"
        
        print(f"✓ Season context: '{data['season_name']}' - {data['total_matches']} matches, {data['total_training']} training sessions")

    def test_leaderboard_nonexistent_season_404(self, api_client):
        """Test leaderboard for non-existent season returns 404"""
        response = api_client.get(f"{BASE_URL}/api/seasons/000000000000000000000000/leaderboard")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent season leaderboard returns 404")

    def test_leaderboard_max_20_players(self, api_client, active_season_id):
        """Test leaderboard returns max 20 players per category"""
        response = api_client.get(f"{BASE_URL}/api/seasons/{active_season_id}/leaderboard")
        data = response.json()
        
        assert len(data["top_scorers"]) <= 20, f"top_scorers should be max 20, got {len(data['top_scorers'])}"
        assert len(data["top_assists"]) <= 20, f"top_assists should be max 20, got {len(data['top_assists'])}"
        assert len(data["best_attendance"]) <= 20, f"best_attendance should be max 20, got {len(data['best_attendance'])}"
        assert len(data["top_rated"]) <= 20, f"top_rated should be max 20, got {len(data['top_rated'])}"
        
        print(f"✓ Leaderboard respects max 20 players per category")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
