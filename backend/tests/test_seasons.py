"""
Backend API tests for Season Management module:
- GET /api/seasons - list seasons with stats (matches, training_sessions, wins, draws, losses)
- POST /api/seasons - create new season
- GET /api/seasons/{id} - get season detail with matches, training_sessions, teams, stats
- PUT /api/seasons/{id} - update season (name, dates, status)
- PUT /api/seasons/{id} with status=active - deactivates other active seasons
- DELETE /api/seasons/{id} - delete season
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSeasonsAPI:
    """Test seasons CRUD operations"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    # ============ LIST SEASONS ============
    def test_list_seasons(self, auth_headers):
        """Test GET /api/seasons returns list with stats"""
        response = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Retrieved {len(data)} seasons")
        
        # Should have 3 seeded seasons
        assert len(data) >= 3, f"Expected at least 3 seasons, got {len(data)}"
        
        # Verify stats structure in each season
        for season in data:
            assert "id" in season
            assert "name" in season
            assert "start_date" in season
            assert "end_date" in season
            assert "status" in season
            assert "stats" in season
            stats = season["stats"]
            assert "matches" in stats
            assert "training_sessions" in stats
            assert "wins" in stats
            assert "draws" in stats
            assert "losses" in stats
            print(f"  - {season['name']}: {stats['matches']} matches, {stats['training_sessions']} training, W{stats['wins']}-D{stats['draws']}-L{stats['losses']}")
        print("✅ All seasons have correct stats structure")
    
    def test_list_seasons_contains_seeded_data(self, auth_headers):
        """Verify seeded seasons: Summer Camp 2026, 2025-2026 Season, 2024-2025 Season"""
        response = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        data = response.json()
        
        season_names = [s["name"] for s in data]
        expected_seasons = ["Summer Camp 2026", "2025-2026 Season", "2024-2025 Season"]
        
        for expected in expected_seasons:
            assert expected in season_names, f"Missing seeded season: {expected}"
            print(f"✅ Found seeded season: {expected}")
    
    def test_active_season_has_stats(self, auth_headers):
        """Verify active season (2025-2026) has match and training data"""
        response = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        data = response.json()
        
        active_season = next((s for s in data if s["status"] == "active"), None)
        assert active_season is not None, "No active season found"
        assert active_season["name"] == "2025-2026 Season", f"Active season name mismatch: {active_season['name']}"
        
        stats = active_season["stats"]
        assert stats["matches"] > 0, f"Active season should have matches, got {stats['matches']}"
        assert stats["training_sessions"] > 0, f"Active season should have training, got {stats['training_sessions']}"
        print(f"✅ Active season '{active_season['name']}' has {stats['matches']} matches, {stats['training_sessions']} training sessions")
    
    # ============ CREATE SEASON ============
    def test_create_season(self, auth_headers):
        """Test POST /api/seasons creates new season"""
        new_season = {
            "name": "TEST_Winter Training 2026",
            "start_date": "2026-12-01",
            "end_date": "2027-02-28",
            "description": "Test winter training season",
            "status": "upcoming"
        }
        
        response = requests.post(f"{BASE_URL}/api/seasons", headers=auth_headers, json=new_season)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == new_season["name"]
        assert data["start_date"] == new_season["start_date"]
        assert data["end_date"] == new_season["end_date"]
        assert data["description"] == new_season["description"]
        assert data["status"] == new_season["status"]
        
        print(f"✅ Season created with id: {data['id']}")
        
        # Verify it appears in list
        list_resp = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        season_names = [s["name"] for s in list_resp.json()]
        assert new_season["name"] in season_names
        print("✅ Created season appears in list")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/seasons/{data['id']}", headers=auth_headers)
        return data["id"]
    
    # ============ GET SEASON DETAIL ============
    def test_get_season_detail(self, auth_headers):
        """Test GET /api/seasons/{id} returns detail with matches, training, teams, stats"""
        # Get list to find active season
        list_resp = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        seasons = list_resp.json()
        active_season = next((s for s in seasons if s["status"] == "active"), None)
        assert active_season is not None
        
        # Get detail
        response = requests.get(f"{BASE_URL}/api/seasons/{active_season['id']}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        assert "id" in data
        assert "name" in data
        assert "start_date" in data
        assert "end_date" in data
        assert "description" in data
        assert "status" in data
        assert "matches" in data
        assert "training_sessions" in data
        assert "teams" in data
        assert "stats" in data
        
        print(f"✅ Season detail retrieved: {data['name']}")
        print(f"  - Matches: {len(data['matches'])}")
        print(f"  - Training sessions: {len(data['training_sessions'])}")
        print(f"  - Teams: {len(data['teams'])}")
        
        # Verify stats detail
        stats = data["stats"]
        assert "total_matches" in stats
        assert "completed_matches" in stats
        assert "total_training" in stats
        assert "wins" in stats
        assert "draws" in stats
        assert "losses" in stats
        assert "goals_for" in stats
        assert "goals_against" in stats
        print(f"  - Stats: W{stats['wins']}-D{stats['draws']}-L{stats['losses']}, GF:{stats['goals_for']}, GA:{stats['goals_against']}")
        print("✅ Season detail has all required fields")
    
    def test_get_season_detail_matches_structure(self, auth_headers):
        """Verify matches in season detail have correct structure"""
        list_resp = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        active_season = next((s for s in list_resp.json() if s["status"] == "active"), None)
        
        response = requests.get(f"{BASE_URL}/api/seasons/{active_season['id']}", headers=auth_headers)
        data = response.json()
        
        if len(data["matches"]) > 0:
            match = data["matches"][0]
            assert "id" in match
            assert "date" in match
            assert "team_id" in match
            assert "opponent" in match
            assert "type" in match
            assert "status" in match
            print(f"✅ Match structure verified: {match['date']} vs {match['opponent']}")
    
    def test_get_season_detail_training_structure(self, auth_headers):
        """Verify training sessions in season detail have correct structure"""
        list_resp = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        active_season = next((s for s in list_resp.json() if s["status"] == "active"), None)
        
        response = requests.get(f"{BASE_URL}/api/seasons/{active_season['id']}", headers=auth_headers)
        data = response.json()
        
        if len(data["training_sessions"]) > 0:
            session = data["training_sessions"][0]
            assert "id" in session
            assert "date" in session
            assert "title" in session
            assert "type" in session
            assert "location" in session
            assert "start_time" in session
            assert "end_time" in session
            print(f"✅ Training structure verified: {session['date']} - {session['title']}")
    
    def test_get_nonexistent_season_returns_404(self, auth_headers):
        """Test GET /api/seasons/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/seasons/000000000000000000000000", headers=auth_headers)
        assert response.status_code == 404
        print("✅ Non-existent season returns 404")
    
    # ============ UPDATE SEASON ============
    def test_update_season(self, auth_headers):
        """Test PUT /api/seasons/{id} updates season fields"""
        # Create test season
        create_resp = requests.post(f"{BASE_URL}/api/seasons", headers=auth_headers, json={
            "name": "TEST_Update Season",
            "start_date": "2027-01-01",
            "end_date": "2027-06-30",
            "description": "Original description",
            "status": "upcoming"
        })
        season_id = create_resp.json()["id"]
        
        try:
            # Update
            update_data = {
                "name": "TEST_Update Season Modified",
                "description": "Updated description",
                "status": "upcoming"
            }
            response = requests.put(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers, json=update_data)
            assert response.status_code == 200
            
            # Verify
            get_resp = requests.get(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers)
            updated = get_resp.json()
            assert updated["name"] == "TEST_Update Season Modified"
            assert updated["description"] == "Updated description"
            print(f"✅ Season updated successfully: {updated['name']}")
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers)
    
    def test_update_season_to_active_deactivates_others(self, auth_headers):
        """Test PUT /api/seasons/{id} with status=active deactivates other active seasons"""
        # Get current active season
        list_resp = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
        original_active = next((s for s in list_resp.json() if s["status"] == "active"), None)
        assert original_active is not None, "Need an active season to test"
        
        # Create a new season
        create_resp = requests.post(f"{BASE_URL}/api/seasons", headers=auth_headers, json={
            "name": "TEST_New Active Season",
            "start_date": "2027-01-01",
            "end_date": "2027-12-31",
            "description": "Testing active toggle",
            "status": "upcoming"
        })
        new_season_id = create_resp.json()["id"]
        
        try:
            # Set new season to active
            response = requests.put(f"{BASE_URL}/api/seasons/{new_season_id}", headers=auth_headers, json={"status": "active"})
            assert response.status_code == 200
            
            # Verify original active is now completed
            list_resp2 = requests.get(f"{BASE_URL}/api/seasons", headers=auth_headers)
            seasons = list_resp2.json()
            
            original_now = next((s for s in seasons if s["id"] == original_active["id"]), None)
            new_now = next((s for s in seasons if s["id"] == new_season_id), None)
            
            assert new_now["status"] == "active", f"New season should be active, got {new_now['status']}"
            assert original_now["status"] == "completed", f"Original active should be completed, got {original_now['status']}"
            
            print(f"✅ Setting '{new_now['name']}' to active correctly deactivated '{original_now['name']}'")
            
            # Restore original active
            requests.put(f"{BASE_URL}/api/seasons/{original_active['id']}", headers=auth_headers, json={"status": "active"})
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/seasons/{new_season_id}", headers=auth_headers)
    
    # ============ DELETE SEASON ============
    def test_delete_season(self, auth_headers):
        """Test DELETE /api/seasons/{id} deletes season"""
        # Create test season
        create_resp = requests.post(f"{BASE_URL}/api/seasons", headers=auth_headers, json={
            "name": "TEST_Delete Season",
            "start_date": "2028-01-01",
            "end_date": "2028-06-30",
            "status": "upcoming"
        })
        season_id = create_resp.json()["id"]
        
        # Verify exists
        get_resp = requests.get(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        
        # Verify deleted
        get_resp2 = requests.get(f"{BASE_URL}/api/seasons/{season_id}", headers=auth_headers)
        assert get_resp2.status_code == 404
        print(f"✅ Season deleted successfully")
    
    def test_delete_nonexistent_season_returns_404(self, auth_headers):
        """Test DELETE /api/seasons/{invalid_id} returns 404"""
        response = requests.delete(f"{BASE_URL}/api/seasons/000000000000000000000000", headers=auth_headers)
        assert response.status_code == 404
        print("✅ Delete non-existent season returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
