"""
Test suite for Advanced Match Statistics feature
Tests: GET /api/matches, GET /api/matches/{match_id}, POST /api/matches/{match_id}/events
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://football-academy-mvp.preview.emergentagent.com').rstrip('/')

# Test match IDs from seed data
COMPLETED_MATCH_ID = "69adc5a32e1800e222f9b7a7"  # City Youth, 5-2
SCHEDULED_MATCH_ID = "69adc5a32e1800e222f9b7b5"  # Sporting Academy

class TestMatchAdvancedStatistics:
    """Tests for Advanced Match Statistics feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
    
    # ===== GET /api/matches tests =====
    
    def test_get_matches_list_returns_200(self):
        """GET /api/matches returns 200 with list of matches"""
        response = requests.get(f"{BASE_URL}/api/matches", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: GET /api/matches returned {len(data)} matches")
    
    def test_get_matches_has_correct_statuses(self):
        """GET /api/matches returns matches with completed/scheduled statuses"""
        response = requests.get(f"{BASE_URL}/api/matches", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        statuses = set(m.get("status") for m in data)
        assert "completed" in statuses or "scheduled" in statuses
        
        completed = [m for m in data if m.get("status") == "completed"]
        scheduled = [m for m in data if m.get("status") == "scheduled"]
        print(f"SUCCESS: Found {len(completed)} completed and {len(scheduled)} scheduled matches")
    
    def test_get_matches_filter_by_status(self):
        """GET /api/matches?status=completed filters correctly"""
        response = requests.get(f"{BASE_URL}/api/matches?status=completed", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        for match in data:
            assert match.get("status") == "completed"
        print(f"SUCCESS: Status filter works - {len(data)} completed matches")
    
    # ===== GET /api/matches/{match_id} - Completed Match tests =====
    
    def test_get_completed_match_returns_200(self):
        """GET /api/matches/{match_id} returns 200 for completed match"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "completed"
        print(f"SUCCESS: Completed match {COMPLETED_MATCH_ID} returned 200")
    
    def test_completed_match_has_team_stats(self):
        """Completed match has team_stats with possession, shots, etc."""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        team_stats = data.get("team_stats")
        assert team_stats is not None, "team_stats should be present"
        
        # Check required team_stats fields
        required_fields = ["possession", "shots", "shots_on_target", "corners", "fouls", "pass_accuracy", "saves"]
        for field in required_fields:
            assert field in team_stats, f"team_stats missing {field}"
        
        # Check opponent stats
        opp_fields = ["opp_possession", "opp_shots", "opp_shots_on_target", "opp_corners", "opp_fouls"]
        for field in opp_fields:
            assert field in team_stats, f"team_stats missing {field}"
        
        print(f"SUCCESS: team_stats has all required fields: {list(team_stats.keys())}")
    
    def test_completed_match_has_events(self):
        """Completed match has events array with goals, cards, substitutions"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        events = data.get("events")
        assert events is not None, "events should be present"
        assert isinstance(events, list)
        assert len(events) > 0, "Completed match should have events"
        
        # Check event structure
        event_types = set()
        for event in events:
            assert "type" in event
            assert "minute" in event
            event_types.add(event["type"])
        
        # Should have at least goals
        assert "goal" in event_types, "Should have goal events"
        print(f"SUCCESS: Match has {len(events)} events with types: {event_types}")
    
    def test_completed_match_events_ordered_by_minute(self):
        """Events are ordered by minute ascending"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        events = data.get("events", [])
        minutes = [e.get("minute", 0) for e in events]
        assert minutes == sorted(minutes), "Events should be ordered by minute"
        print(f"SUCCESS: Events ordered by minute: {minutes[:5]}...")
    
    def test_completed_match_has_player_stats(self):
        """Completed match has player_stats with ratings, goals, assists"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        player_stats = data.get("player_stats")
        assert player_stats is not None, "player_stats should be present"
        assert isinstance(player_stats, list)
        assert len(player_stats) > 0, "Should have player stats"
        
        # Check player stat structure
        ps = player_stats[0]
        required_fields = ["player_id", "player_name", "position", "minutes_played", "goals", "assists", "rating"]
        for field in required_fields:
            assert field in ps, f"player_stats missing {field}"
        
        print(f"SUCCESS: {len(player_stats)} players with stats, first: {ps['player_name']} rating {ps['rating']}")
    
    def test_completed_match_player_stats_sorted_by_rating(self):
        """Player stats are sorted by rating descending"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        player_stats = data.get("player_stats", [])
        ratings = [ps.get("rating", 0) for ps in player_stats]
        assert ratings == sorted(ratings, reverse=True), "Player stats should be sorted by rating desc"
        print(f"SUCCESS: Player stats sorted by rating: {ratings[:5]}")
    
    def test_completed_match_has_motm(self):
        """Completed match has MOTM (Man of the Match) with rating >= 7"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        motm = data.get("motm")
        assert motm is not None, "MOTM should be present for completed match"
        assert motm.get("rating", 0) >= 7, "MOTM should have rating >= 7"
        assert "player_name" in motm
        assert "position" in motm
        print(f"SUCCESS: MOTM is {motm['player_name']} with rating {motm['rating']}")
    
    def test_completed_match_has_summary(self):
        """Completed match has summary with aggregated stats"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        summary = data.get("summary")
        assert summary is not None, "summary should be present"
        
        required_fields = ["total_goals", "total_assists", "total_yellows", "avg_rating", "players_used"]
        for field in required_fields:
            assert field in summary, f"summary missing {field}"
        
        print(f"SUCCESS: Summary - Goals: {summary['total_goals']}, Assists: {summary['total_assists']}, Avg Rating: {summary['avg_rating']}")
    
    def test_completed_match_has_formation(self):
        """Completed match has formation field"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        formation = data.get("formation")
        assert formation is not None, "formation should be present"
        assert isinstance(formation, str)
        print(f"SUCCESS: Formation is {formation}")
    
    def test_completed_match_has_team_info(self):
        """Completed match has team info with name"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        team = data.get("team")
        assert team is not None, "team should be present"
        assert "name" in team
        print(f"SUCCESS: Team is {team['name']}")
    
    # ===== GET /api/matches/{match_id} - Scheduled Match tests =====
    
    def test_get_scheduled_match_returns_200(self):
        """GET /api/matches/{match_id} returns 200 for scheduled match"""
        response = requests.get(f"{BASE_URL}/api/matches/{SCHEDULED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "scheduled"
        print(f"SUCCESS: Scheduled match {SCHEDULED_MATCH_ID} returned 200")
    
    def test_scheduled_match_has_null_scores(self):
        """Scheduled match has null home_score and away_score"""
        response = requests.get(f"{BASE_URL}/api/matches/{SCHEDULED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("home_score") is None, "Scheduled match should have null home_score"
        assert data.get("away_score") is None, "Scheduled match should have null away_score"
        print("SUCCESS: Scheduled match has null scores")
    
    def test_scheduled_match_has_empty_player_stats(self):
        """Scheduled match has empty player_stats"""
        response = requests.get(f"{BASE_URL}/api/matches/{SCHEDULED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        player_stats = data.get("player_stats", [])
        assert len(player_stats) == 0, "Scheduled match should have empty player_stats"
        print("SUCCESS: Scheduled match has empty player_stats")
    
    def test_scheduled_match_has_no_motm(self):
        """Scheduled match has null MOTM"""
        response = requests.get(f"{BASE_URL}/api/matches/{SCHEDULED_MATCH_ID}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("motm") is None, "Scheduled match should have null MOTM"
        print("SUCCESS: Scheduled match has null MOTM")
    
    # ===== POST /api/matches/{match_id}/events tests =====
    
    def test_add_match_event_goal(self):
        """POST /api/matches/{match_id}/events adds a goal event"""
        event_data = {
            "type": "goal",
            "minute": 88,
            "player_name": "Test Scorer",
            "detail": "Test goal from pytest"
        }
        response = requests.post(
            f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}/events",
            headers=self.headers,
            json=event_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("type") == "goal"
        assert data.get("minute") == 88
        assert data.get("player_name") == "Test Scorer"
        assert "id" in data
        print(f"SUCCESS: Added goal event with id {data['id']}")
    
    def test_add_match_event_yellow_card(self):
        """POST /api/matches/{match_id}/events adds a yellow card event"""
        event_data = {
            "type": "yellow_card",
            "minute": 65,
            "player_name": "Test Player",
            "detail": "Tactical foul"
        }
        response = requests.post(
            f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}/events",
            headers=self.headers,
            json=event_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("type") == "yellow_card"
        print(f"SUCCESS: Added yellow_card event with id {data['id']}")
    
    def test_add_match_event_substitution(self):
        """POST /api/matches/{match_id}/events adds a substitution event"""
        event_data = {
            "type": "substitution",
            "minute": 70,
            "detail": "Tactical change"
        }
        response = requests.post(
            f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}/events",
            headers=self.headers,
            json=event_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("type") == "substitution"
        print(f"SUCCESS: Added substitution event with id {data['id']}")
    
    def test_add_event_to_nonexistent_match_returns_404(self):
        """POST /api/matches/{invalid_id}/events returns 404"""
        event_data = {"type": "goal", "minute": 10}
        response = requests.post(
            f"{BASE_URL}/api/matches/000000000000000000000000/events",
            headers=self.headers,
            json=event_data
        )
        assert response.status_code == 404
        print("SUCCESS: Adding event to non-existent match returns 404")
    
    # ===== Error handling tests =====
    
    def test_get_nonexistent_match_returns_404(self):
        """GET /api/matches/{invalid_id} returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/matches/000000000000000000000000",
            headers=self.headers
        )
        assert response.status_code == 404
        print("SUCCESS: Non-existent match returns 404")
    
    def test_get_match_without_auth_returns_401(self):
        """GET /api/matches/{match_id} without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/matches/{COMPLETED_MATCH_ID}")
        assert response.status_code == 401
        print("SUCCESS: Request without auth returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
