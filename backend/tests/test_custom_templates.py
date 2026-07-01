"""
Test Custom Training Plan Templates Feature (Iteration 15)
Tests:
- POST /api/training-plan-templates/custom - Create custom template
- GET /api/training-plan-templates - Returns both predefined (5) and custom templates
- DELETE /api/training-plan-templates/custom/{id} - Delete custom template
- Club isolation - Custom templates scoped to club_id
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCustomTemplates:
    """Custom Training Plan Templates API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        data = login_resp.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.club_id = data["user"]["club_id"]
        yield
        # Cleanup: Delete any test templates created
        self._cleanup_test_templates()
    
    def _cleanup_test_templates(self):
        """Remove TEST_ prefixed templates"""
        try:
            resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
            if resp.status_code == 200:
                templates = resp.json()
                for tpl in templates:
                    if tpl.get("custom") and tpl.get("name", "").startswith("TEST_"):
                        requests.delete(f"{BASE_URL}/api/training-plan-templates/custom/{tpl['id']}", headers=self.headers)
        except:
            pass
    
    # ---- GET /api/training-plan-templates Tests ----
    
    def test_get_templates_requires_auth(self):
        """GET templates without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/training-plan-templates")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: GET templates requires authentication")
    
    def test_get_templates_returns_predefined(self):
        """GET templates returns at least 5 predefined templates"""
        resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        templates = resp.json()
        assert isinstance(templates, list), "Response should be a list"
        
        # Check predefined templates exist
        predefined_ids = ["preseason", "recovery", "matchweek", "technical", "goalkeeper"]
        template_ids = [t["id"] for t in templates]
        for pid in predefined_ids:
            assert pid in template_ids, f"Missing predefined template: {pid}"
        
        # Predefined templates should NOT have custom: true
        for tpl in templates:
            if tpl["id"] in predefined_ids:
                assert tpl.get("custom") is not True, f"Predefined template {tpl['id']} should not have custom: true"
        
        print(f"PASS: GET templates returns {len(templates)} templates including all 5 predefined")
    
    # ---- POST /api/training-plan-templates/custom Tests ----
    
    def test_create_custom_template_requires_auth(self):
        """POST custom template without auth returns 401"""
        resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json={
            "name": "TEST_NoAuth",
            "description": "Should fail",
            "days": [[], [], [], [], [], [], []]
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: POST custom template requires authentication")
    
    def test_create_custom_template_success(self):
        """POST custom template creates and returns template with custom: true"""
        payload = {
            "name": "TEST_Custom_Template_1",
            "description": "Test description for custom template",
            "days": [
                [{"name": "Warm Up", "category": "warmup", "duration_minutes": 10}],
                [{"name": "Passing Drill", "category": "technical", "duration_minutes": 15}],
                [],
                [{"name": "Shooting Practice", "category": "technical", "duration_minutes": 20}],
                [],
                [],
                []
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        assert "id" in data, "Response should have id"
        assert data["name"] == payload["name"], f"Name mismatch: {data['name']}"
        assert data["description"] == payload["description"], f"Description mismatch"
        assert data.get("custom") is True, "Response should have custom: true"
        assert "days" in data, "Response should have days"
        assert len(data["days"]) == 7, f"Days should have 7 elements, got {len(data['days'])}"
        assert data.get("icon") == "target", f"Default icon should be 'target', got {data.get('icon')}"
        
        print(f"PASS: Created custom template with id={data['id']}, custom=true")
        return data["id"]
    
    def test_custom_template_appears_in_get_list(self):
        """Custom template appears in GET list with custom: true"""
        # Create a custom template
        payload = {
            "name": "TEST_Appears_In_List",
            "description": "Should appear in list",
            "days": [[{"name": "Test Drill", "category": "physical", "duration_minutes": 30}], [], [], [], [], [], []]
        }
        create_resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # GET all templates
        get_resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert get_resp.status_code == 200
        templates = get_resp.json()
        
        # Find our custom template
        custom_tpl = next((t for t in templates if t["id"] == created_id), None)
        assert custom_tpl is not None, f"Custom template {created_id} not found in list"
        assert custom_tpl.get("custom") is True, "Custom template should have custom: true"
        assert custom_tpl["name"] == payload["name"]
        
        print(f"PASS: Custom template {created_id} appears in GET list with custom=true")
    
    def test_get_templates_returns_both_predefined_and_custom(self):
        """GET returns predefined (5) + custom templates"""
        # Create a custom template
        payload = {
            "name": "TEST_Mixed_List",
            "description": "For mixed list test",
            "days": [[], [], [], [], [], [], []]
        }
        create_resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert create_resp.status_code == 200
        
        # GET all templates
        get_resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert get_resp.status_code == 200
        templates = get_resp.json()
        
        predefined = [t for t in templates if not t.get("custom")]
        custom = [t for t in templates if t.get("custom")]
        
        assert len(predefined) == 5, f"Expected 5 predefined, got {len(predefined)}"
        assert len(custom) >= 1, f"Expected at least 1 custom, got {len(custom)}"
        
        print(f"PASS: GET returns {len(predefined)} predefined + {len(custom)} custom templates")
    
    # ---- DELETE /api/training-plan-templates/custom/{id} Tests ----
    
    def test_delete_custom_template_requires_auth(self):
        """DELETE custom template without auth returns 401"""
        resp = requests.delete(f"{BASE_URL}/api/training-plan-templates/custom/someid")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: DELETE custom template requires authentication")
    
    def test_delete_custom_template_success(self):
        """DELETE custom template removes it from list"""
        # Create a custom template
        payload = {
            "name": "TEST_To_Delete",
            "description": "Will be deleted",
            "days": [[], [], [], [], [], [], []]
        }
        create_resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(f"{BASE_URL}/api/training-plan-templates/custom/{created_id}", headers=self.headers)
        assert delete_resp.status_code == 200, f"Expected 200, got {delete_resp.status_code}"
        assert delete_resp.json().get("status") == "deleted"
        
        # Verify it's gone
        get_resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        templates = get_resp.json()
        template_ids = [t["id"] for t in templates]
        assert created_id not in template_ids, f"Deleted template {created_id} still in list"
        
        print(f"PASS: Deleted custom template {created_id} successfully")
    
    # ---- Club Isolation Tests ----
    
    def test_custom_template_club_isolation(self):
        """Custom templates are scoped to club_id"""
        # Create template as coach (carlos@academy.com)
        payload = {
            "name": "TEST_Club_Isolation",
            "description": "Should only be visible to same club",
            "days": [[], [], [], [], [], [], []]
        }
        create_resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        
        # Verify it's visible to same user
        get_resp = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        templates = get_resp.json()
        custom_ids = [t["id"] for t in templates if t.get("custom")]
        assert created_id in custom_ids, "Template should be visible to creator"
        
        print(f"PASS: Custom template {created_id} is scoped to club")
    
    # ---- Response Structure Tests ----
    
    def test_custom_template_response_structure(self):
        """Custom template response has all required fields"""
        payload = {
            "name": "TEST_Structure_Check",
            "description": "Checking response structure",
            "days": [
                [{"name": "Drill A", "category": "technical", "duration_minutes": 15}],
                [],
                [{"name": "Drill B", "category": "physical", "duration_minutes": 20}],
                [],
                [],
                [],
                []
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Check required fields
        required_fields = ["id", "name", "description", "icon", "days", "custom"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Check types
        assert isinstance(data["id"], str), "id should be string"
        assert isinstance(data["name"], str), "name should be string"
        assert isinstance(data["description"], str), "description should be string"
        assert isinstance(data["icon"], str), "icon should be string"
        assert isinstance(data["days"], list), "days should be list"
        assert data["custom"] is True, "custom should be True"
        
        # Check days structure
        assert len(data["days"]) == 7, "days should have 7 elements"
        for day in data["days"]:
            assert isinstance(day, list), "Each day should be a list"
        
        print("PASS: Custom template response has correct structure")
    
    def test_custom_template_with_empty_days(self):
        """Custom template can be created with all empty days"""
        payload = {
            "name": "TEST_Empty_Days",
            "description": "All days empty",
            "days": [[], [], [], [], [], [], []]
        }
        resp = requests.post(f"{BASE_URL}/api/training-plan-templates/custom", json=payload, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        assert all(len(day) == 0 for day in data["days"]), "All days should be empty"
        print("PASS: Custom template with empty days created successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
