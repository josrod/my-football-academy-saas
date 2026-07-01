"""
Test suite for Training Drills Library feature - Iteration 11
Tests CRUD operations, filtering, search, and training session drill assignment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COACH_EMAIL = "carlos@academy.com"
COACH_PASSWORD = "coach123"

class TestDrillsLibrary:
    """Tests for the Drills Library feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as coach and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_drill_id = None
        yield
        # Cleanup: Delete any test drill created
        if self.created_drill_id:
            requests.delete(f"{BASE_URL}/api/drills/{self.created_drill_id}", headers=self.headers)
    
    # ===== GET ALL DRILLS =====
    def test_get_all_drills_returns_20_seeded(self):
        """GET /api/drills returns all drills (should be 20 seeded drills)"""
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        drills = response.json()
        assert isinstance(drills, list), "Response should be a list"
        # Should have at least 20 seeded drills
        assert len(drills) >= 20, f"Expected at least 20 drills, got {len(drills)}"
        print(f"✓ GET /api/drills returns {len(drills)} drills (expected >= 20)")
    
    def test_drill_structure(self):
        """Verify drill object has all required fields"""
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) > 0, "No drills found"
        
        drill = drills[0]
        required_fields = ["id", "name", "description", "category", "difficulty", 
                          "duration_minutes", "min_players", "max_players", 
                          "equipment", "min_age", "instructions", "tags", "club_id"]
        for field in required_fields:
            assert field in drill, f"Missing field: {field}"
        print(f"✓ Drill structure contains all required fields: {required_fields}")
    
    # ===== CATEGORY FILTERING =====
    def test_filter_by_category_goalkeeper(self):
        """GET /api/drills?category=goalkeeper returns only goalkeeper drills (3 expected)"""
        response = requests.get(f"{BASE_URL}/api/drills?category=goalkeeper", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        drills = response.json()
        assert len(drills) == 3, f"Expected 3 goalkeeper drills, got {len(drills)}"
        for drill in drills:
            assert drill["category"] == "goalkeeper", f"Drill {drill['name']} has wrong category: {drill['category']}"
        print(f"✓ Filter by goalkeeper returns 3 drills: {[d['name'] for d in drills]}")
    
    def test_filter_by_category_technical(self):
        """GET /api/drills?category=technical returns only technical drills (6 expected)"""
        response = requests.get(f"{BASE_URL}/api/drills?category=technical", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) == 6, f"Expected 6 technical drills, got {len(drills)}"
        for drill in drills:
            assert drill["category"] == "technical"
        print(f"✓ Filter by technical returns 6 drills")
    
    def test_filter_by_category_tactical(self):
        """GET /api/drills?category=tactical returns only tactical drills (5 expected)"""
        response = requests.get(f"{BASE_URL}/api/drills?category=tactical", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) == 5, f"Expected 5 tactical drills, got {len(drills)}"
        for drill in drills:
            assert drill["category"] == "tactical"
        print(f"✓ Filter by tactical returns 5 drills")
    
    def test_filter_by_category_physical(self):
        """GET /api/drills?category=physical returns only physical drills (4 expected)"""
        response = requests.get(f"{BASE_URL}/api/drills?category=physical", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) == 4, f"Expected 4 physical drills, got {len(drills)}"
        for drill in drills:
            assert drill["category"] == "physical"
        print(f"✓ Filter by physical returns 4 drills")
    
    def test_filter_by_category_warmup(self):
        """GET /api/drills?category=warmup returns only warmup drills (2 expected)"""
        response = requests.get(f"{BASE_URL}/api/drills?category=warmup", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) == 2, f"Expected 2 warmup drills, got {len(drills)}"
        for drill in drills:
            assert drill["category"] == "warmup"
        print(f"✓ Filter by warmup returns 2 drills")
    
    # ===== DIFFICULTY FILTERING =====
    def test_filter_by_difficulty_advanced(self):
        """GET /api/drills?difficulty=advanced returns only advanced drills"""
        response = requests.get(f"{BASE_URL}/api/drills?difficulty=advanced", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) > 0, "Expected at least 1 advanced drill"
        for drill in drills:
            assert drill["difficulty"] == "advanced", f"Drill {drill['name']} has wrong difficulty: {drill['difficulty']}"
        print(f"✓ Filter by advanced returns {len(drills)} drills")
    
    def test_filter_by_difficulty_beginner(self):
        """GET /api/drills?difficulty=beginner returns only beginner drills"""
        response = requests.get(f"{BASE_URL}/api/drills?difficulty=beginner", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) > 0, "Expected at least 1 beginner drill"
        for drill in drills:
            assert drill["difficulty"] == "beginner"
        print(f"✓ Filter by beginner returns {len(drills)} drills")
    
    def test_filter_by_difficulty_intermediate(self):
        """GET /api/drills?difficulty=intermediate returns only intermediate drills"""
        response = requests.get(f"{BASE_URL}/api/drills?difficulty=intermediate", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) > 0, "Expected at least 1 intermediate drill"
        for drill in drills:
            assert drill["difficulty"] == "intermediate"
        print(f"✓ Filter by intermediate returns {len(drills)} drills")
    
    # ===== COMBINED FILTERING =====
    def test_filter_by_category_and_difficulty(self):
        """GET /api/drills?category=technical&difficulty=beginner returns filtered drills"""
        response = requests.get(f"{BASE_URL}/api/drills?category=technical&difficulty=beginner", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        # Technical beginner drills: Rondo 4v2, Passing Triangle, Ball Control Relay = 3
        assert len(drills) >= 1, "Expected at least 1 technical beginner drill"
        for drill in drills:
            assert drill["category"] == "technical", f"Wrong category: {drill['category']}"
            assert drill["difficulty"] == "beginner", f"Wrong difficulty: {drill['difficulty']}"
        print(f"✓ Filter by technical+beginner returns {len(drills)} drills")
    
    # ===== GET SINGLE DRILL =====
    def test_get_single_drill_by_id(self):
        """GET /api/drills/{drill_id} returns single drill with full details"""
        # First get all drills to get an ID
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) > 0
        
        drill_id = drills[0]["id"]
        response = requests.get(f"{BASE_URL}/api/drills/{drill_id}", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        drill = response.json()
        assert drill["id"] == drill_id
        assert "instructions" in drill and isinstance(drill["instructions"], list)
        assert "tags" in drill and isinstance(drill["tags"], list)
        assert "equipment" in drill and isinstance(drill["equipment"], list)
        print(f"✓ GET /api/drills/{drill_id} returns drill with instructions, tags, equipment")
    
    def test_get_nonexistent_drill_returns_404(self):
        """GET /api/drills/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/drills/000000000000000000000000", headers=self.headers)
        assert response.status_code == 404
        print("✓ GET nonexistent drill returns 404")
    
    # ===== CREATE DRILL =====
    def test_create_custom_drill(self):
        """POST /api/drills creates a new custom drill"""
        new_drill = {
            "name": "TEST_Custom Passing Drill",
            "description": "A test drill for passing practice",
            "category": "technical",
            "difficulty": "beginner",
            "duration_minutes": 15,
            "min_players": 4,
            "max_players": 12,
            "equipment": ["cones", "balls"],
            "min_age": 8,
            "instructions": ["Set up cones in a square", "Pass the ball around", "Focus on accuracy"],
            "tags": ["passing", "test"]
        }
        
        response = requests.post(f"{BASE_URL}/api/drills", json=new_drill, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        assert "id" in created, "Created drill should have an ID"
        assert created["name"] == new_drill["name"]
        assert created["category"] == new_drill["category"]
        assert created["difficulty"] == new_drill["difficulty"]
        assert created["instructions"] == new_drill["instructions"]
        assert created["tags"] == new_drill["tags"]
        assert created["equipment"] == new_drill["equipment"]
        
        self.created_drill_id = created["id"]
        print(f"✓ POST /api/drills creates drill with ID: {created['id']}")
        
        # Verify it appears in the list
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        drills = response.json()
        drill_ids = [d["id"] for d in drills]
        assert created["id"] in drill_ids, "Created drill should appear in list"
        print("✓ Created drill appears in GET /api/drills list")
    
    # ===== UPDATE DRILL =====
    def test_update_drill(self):
        """PUT /api/drills/{drill_id} updates a drill"""
        # First create a drill
        new_drill = {
            "name": "TEST_Drill to Update",
            "description": "Original description",
            "category": "technical",
            "difficulty": "beginner",
            "duration_minutes": 10,
            "min_players": 2,
            "max_players": 8,
            "equipment": [],
            "min_age": 6,
            "instructions": ["Step 1"],
            "tags": ["test"]
        }
        
        response = requests.post(f"{BASE_URL}/api/drills", json=new_drill, headers=self.headers)
        assert response.status_code == 200
        created = response.json()
        self.created_drill_id = created["id"]
        
        # Update the drill
        update_data = {
            "name": "TEST_Updated Drill Name",
            "description": "Updated description",
            "difficulty": "intermediate"
        }
        
        response = requests.put(f"{BASE_URL}/api/drills/{created['id']}", json=update_data, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/drills/{created['id']}", headers=self.headers)
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == update_data["name"]
        assert updated["description"] == update_data["description"]
        assert updated["difficulty"] == update_data["difficulty"]
        print(f"✓ PUT /api/drills/{created['id']} updates drill successfully")
    
    # ===== DELETE DRILL =====
    def test_delete_drill(self):
        """DELETE /api/drills/{drill_id} deletes a drill"""
        # First create a drill
        new_drill = {
            "name": "TEST_Drill to Delete",
            "description": "Will be deleted",
            "category": "technical",
            "difficulty": "beginner",
            "duration_minutes": 5,
            "min_players": 2,
            "max_players": 4,
            "equipment": [],
            "min_age": 6,
            "instructions": [],
            "tags": []
        }
        
        response = requests.post(f"{BASE_URL}/api/drills", json=new_drill, headers=self.headers)
        assert response.status_code == 200
        created = response.json()
        drill_id = created["id"]
        
        # Delete the drill
        response = requests.delete(f"{BASE_URL}/api/drills/{drill_id}", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify deletion - should return 404
        response = requests.get(f"{BASE_URL}/api/drills/{drill_id}", headers=self.headers)
        assert response.status_code == 404, "Deleted drill should return 404"
        
        # Clear the ID since we already deleted it
        self.created_drill_id = None
        print(f"✓ DELETE /api/drills/{drill_id} deletes drill successfully")


class TestTrainingSessionDrills:
    """Tests for assigning drills to training sessions"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as coach and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_session_id = None
        yield
        # Cleanup
        if self.created_session_id:
            # No delete endpoint for sessions, but that's okay
            pass
    
    def test_assign_drills_to_training_session(self):
        """POST /api/training/{session_id}/drills assigns drills to a training session"""
        # Get existing training sessions
        response = requests.get(f"{BASE_URL}/api/training", headers=self.headers)
        assert response.status_code == 200
        sessions = response.json()
        
        if len(sessions) == 0:
            pytest.skip("No training sessions available for testing")
        
        session_id = sessions[0]["id"]
        
        # Get some drill IDs
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        drill_ids = [drills[0]["id"], drills[1]["id"]] if len(drills) >= 2 else [drills[0]["id"]]
        
        # Assign drills to session
        response = requests.post(
            f"{BASE_URL}/api/training/{session_id}/drills",
            json={"drill_ids": drill_ids},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        assert result["status"] == "updated"
        assert result["drill_ids"] == drill_ids
        print(f"✓ POST /api/training/{session_id}/drills assigns {len(drill_ids)} drills")
    
    def test_get_session_drills(self):
        """GET /api/training/{session_id}/drills returns assigned drills for a session"""
        # Get existing training sessions
        response = requests.get(f"{BASE_URL}/api/training", headers=self.headers)
        assert response.status_code == 200
        sessions = response.json()
        
        if len(sessions) == 0:
            pytest.skip("No training sessions available for testing")
        
        session_id = sessions[0]["id"]
        
        # First assign some drills
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        drills = response.json()
        drill_ids = [drills[0]["id"], drills[1]["id"]] if len(drills) >= 2 else [drills[0]["id"]]
        
        requests.post(
            f"{BASE_URL}/api/training/{session_id}/drills",
            json={"drill_ids": drill_ids},
            headers=self.headers
        )
        
        # Get assigned drills
        response = requests.get(f"{BASE_URL}/api/training/{session_id}/drills", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        assigned_drills = response.json()
        assert isinstance(assigned_drills, list)
        assert len(assigned_drills) == len(drill_ids)
        
        # Verify drill structure
        for drill in assigned_drills:
            assert "id" in drill
            assert "name" in drill
            assert "category" in drill
        
        print(f"✓ GET /api/training/{session_id}/drills returns {len(assigned_drills)} assigned drills")
    
    def test_get_session_drills_nonexistent_session(self):
        """GET /api/training/{invalid_id}/drills returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/training/000000000000000000000000/drills",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✓ GET drills for nonexistent session returns 404")


class TestDrillsSearch:
    """Tests for drill search functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as coach"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_search_drills_by_name(self):
        """Search drills by name"""
        response = requests.get(f"{BASE_URL}/api/drills?search=Rondo", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) >= 1, "Should find at least 1 drill with 'Rondo' in name"
        assert any("Rondo" in d["name"] for d in drills)
        print(f"✓ Search 'Rondo' returns {len(drills)} drills")
    
    def test_search_drills_by_tag(self):
        """Search drills by tag"""
        response = requests.get(f"{BASE_URL}/api/drills?search=passing", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) >= 1, "Should find drills with 'passing' tag"
        print(f"✓ Search 'passing' returns {len(drills)} drills")
    
    def test_search_with_no_results(self):
        """Search with no matching results returns empty list"""
        response = requests.get(f"{BASE_URL}/api/drills?search=xyznonexistent123", headers=self.headers)
        assert response.status_code == 200
        drills = response.json()
        assert len(drills) == 0, "Should return empty list for non-matching search"
        print("✓ Search with no results returns empty list")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
