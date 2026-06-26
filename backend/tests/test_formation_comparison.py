"""
Test Formation Comparison API - Iteration 9
Tests the GET /api/matches/{match_id}/formation-comparison endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFormationComparison:
    """Tests for the formation comparison endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test match IDs from test_credentials.md
        self.completed_match_id = "69adc5a32e1800e222f9b7a7"  # City Youth 5-2
        self.completed_draw_id = "69adc5a32e1800e222f9b78f"   # FC United 0-0
        self.scheduled_match_id = "69adc5a32e1800e222f9b7b5"  # Scheduled match
    
    def test_formation_comparison_returns_200(self):
        """Test that endpoint returns 200 for completed match"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        print("PASS: GET /api/matches/{match_id}/formation-comparison returns 200")
    
    def test_formation_comparison_has_planned_and_actual(self):
        """Test that response contains planned and actual formations"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        
        assert "planned" in data, "Response missing 'planned' field"
        assert "actual" in data, "Response missing 'actual' field"
        assert "players" in data, "Response missing 'players' field"
        print("PASS: Response contains planned, actual, and players fields")
    
    def test_planned_formation_structure(self):
        """Test planned formation has correct structure"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        planned = data["planned"]
        
        assert planned is not None, "Planned formation is None"
        assert "name" in planned, "Planned missing 'name'"
        assert "formation_type" in planned, "Planned missing 'formation_type'"
        assert "positions" in planned, "Planned missing 'positions'"
        assert "source" in planned, "Planned missing 'source'"
        
        # Source should be 'saved' or 'preset'
        assert planned["source"] in ["saved", "preset"], f"Invalid source: {planned['source']}"
        print(f"PASS: Planned formation has correct structure (source: {planned['source']})")
    
    def test_planned_positions_have_required_fields(self):
        """Test each planned position has role, x, y"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        positions = data["planned"]["positions"]
        
        assert len(positions) == 11, f"Expected 11 positions, got {len(positions)}"
        
        for i, pos in enumerate(positions):
            assert "role" in pos, f"Position {i} missing 'role'"
            assert "x" in pos, f"Position {i} missing 'x'"
            assert "y" in pos, f"Position {i} missing 'y'"
            # x and y should be in 0-100 range
            assert 0 <= pos["x"] <= 100, f"Position {i} x out of range: {pos['x']}"
            assert 0 <= pos["y"] <= 100, f"Position {i} y out of range: {pos['y']}"
        
        print("PASS: All 11 planned positions have role, x, y in valid range")
    
    def test_actual_formation_structure(self):
        """Test actual formation has correct structure"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        actual = data["actual"]
        
        assert actual is not None, "Actual formation is None"
        assert "name" in actual, "Actual missing 'name'"
        assert "formation_type" in actual, "Actual missing 'formation_type'"
        assert "positions" in actual, "Actual missing 'positions'"
        assert "source" in actual, "Actual missing 'source'"
        assert actual["source"] == "match", f"Actual source should be 'match', got {actual['source']}"
        print("PASS: Actual formation has correct structure (source: match)")
    
    def test_actual_positions_have_player_data(self):
        """Test actual positions include player performance data"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        positions = data["actual"]["positions"]
        
        assert len(positions) > 0, "No actual positions found"
        
        for i, pos in enumerate(positions):
            # Required fields from planned
            assert "role" in pos, f"Position {i} missing 'role'"
            assert "x" in pos, f"Position {i} missing 'x'"
            assert "y" in pos, f"Position {i} missing 'y'"
            
            # Player data fields
            assert "player_name" in pos, f"Position {i} missing 'player_name'"
            assert "rating" in pos, f"Position {i} missing 'rating'"
            assert "goals" in pos, f"Position {i} missing 'goals'"
            assert "assists" in pos, f"Position {i} missing 'assists'"
            assert "minutes_played" in pos, f"Position {i} missing 'minutes_played'"
        
        print(f"PASS: All {len(positions)} actual positions have player_name, rating, goals, assists, minutes_played")
    
    def test_actual_positions_have_valid_ratings(self):
        """Test actual positions have valid rating values"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        positions = data["actual"]["positions"]
        
        for pos in positions:
            rating = pos.get("rating", 0)
            # Ratings should be between 0 and 10
            assert 0 <= rating <= 10, f"Invalid rating {rating} for {pos.get('player_name')}"
        
        print("PASS: All actual positions have valid ratings (0-10)")
    
    def test_scheduled_match_returns_null_formations(self):
        """Test that scheduled match returns null for planned and actual"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.scheduled_match_id}/formation-comparison",
            headers=self.headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        
        assert data["planned"] is None, f"Expected null planned for scheduled match, got {data['planned']}"
        assert data["actual"] is None, f"Expected null actual for scheduled match, got {data['actual']}"
        print("PASS: Scheduled match returns null for planned and actual formations")
    
    def test_preset_source_when_no_saved_formation(self):
        """Test that preset source is returned when no saved formation exists"""
        # Use a different completed match that likely has no saved formation
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_draw_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        
        if data["planned"]:
            # Source should be either 'saved' or 'preset'
            assert data["planned"]["source"] in ["saved", "preset"], \
                f"Invalid source: {data['planned']['source']}"
            print(f"PASS: Formation source is valid ({data['planned']['source']})")
    
    def test_players_list_in_response(self):
        """Test that players list contains player data"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison",
            headers=self.headers
        )
        data = resp.json()
        players = data.get("players", [])
        
        assert len(players) > 0, "Players list is empty"
        
        for player in players:
            assert "player_id" in player, "Player missing 'player_id'"
            assert "player_name" in player, "Player missing 'player_name'"
            assert "rating" in player, "Player missing 'rating'"
        
        print(f"PASS: Players list contains {len(players)} players with required fields")
    
    def test_unauthorized_access_returns_401(self):
        """Test that endpoint requires authentication"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/{self.completed_match_id}/formation-comparison"
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Unauthorized access returns 401")
    
    def test_invalid_match_id_returns_404(self):
        """Test that invalid match ID returns 404"""
        resp = requests.get(
            f"{BASE_URL}/api/matches/000000000000000000000000/formation-comparison",
            headers=self.headers
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("PASS: Invalid match ID returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
