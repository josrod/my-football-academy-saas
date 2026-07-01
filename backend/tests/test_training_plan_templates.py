"""
Test Training Plan Templates Feature
Tests the GET /api/training-plan-templates endpoint that returns 5 predefined templates:
- preseason, recovery, matchweek, technical, goalkeeper
Each template has: id, name, description, icon, days (7 elements array)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTrainingPlanTemplates:
    """Training Plan Templates endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_templates_endpoint_requires_auth(self):
        """Test that templates endpoint returns 401 without token"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Templates endpoint requires authentication (401 without token)")
    
    def test_templates_endpoint_returns_5_templates(self):
        """Test that endpoint returns exactly 5 templates"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        templates = response.json()
        assert isinstance(templates, list), "Response should be a list"
        assert len(templates) == 5, f"Expected 5 templates, got {len(templates)}"
        print(f"PASS: Endpoint returns exactly 5 templates")
    
    def test_template_ids_are_correct(self):
        """Test that all 5 expected template IDs are present"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        expected_ids = {"preseason", "recovery", "matchweek", "technical", "goalkeeper"}
        actual_ids = {t["id"] for t in templates}
        assert actual_ids == expected_ids, f"Expected IDs {expected_ids}, got {actual_ids}"
        print(f"PASS: All 5 template IDs present: {actual_ids}")
    
    def test_template_structure(self):
        """Test that each template has required fields: id, name, description, icon, days"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        required_fields = ["id", "name", "description", "icon", "days"]
        for tpl in templates:
            for field in required_fields:
                assert field in tpl, f"Template {tpl.get('id', 'unknown')} missing field: {field}"
        print(f"PASS: All templates have required fields: {required_fields}")
    
    def test_template_days_array_has_7_elements(self):
        """Test that each template has exactly 7 days (Mon-Sun)"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        for tpl in templates:
            days = tpl.get("days", [])
            assert isinstance(days, list), f"Template {tpl['id']} days should be a list"
            assert len(days) == 7, f"Template {tpl['id']} should have 7 days, got {len(days)}"
        print("PASS: All templates have exactly 7 days in days array")
    
    def test_template_days_contain_drill_objects(self):
        """Test that each day element is an array of drill objects"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        for tpl in templates:
            for day_idx, day in enumerate(tpl["days"]):
                assert isinstance(day, list), f"Template {tpl['id']} day {day_idx} should be a list"
                for drill in day:
                    assert isinstance(drill, dict), f"Drill in {tpl['id']} day {day_idx} should be dict"
                    # Check drill has required fields
                    assert "name" in drill, f"Drill missing 'name' in {tpl['id']} day {day_idx}"
                    assert "category" in drill, f"Drill missing 'category' in {tpl['id']} day {day_idx}"
                    assert "duration_minutes" in drill, f"Drill missing 'duration_minutes' in {tpl['id']} day {day_idx}"
        print("PASS: All days contain properly structured drill objects")
    
    def test_preseason_template_details(self):
        """Test preseason template has correct structure and content"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        preseason = next((t for t in templates if t["id"] == "preseason"), None)
        assert preseason is not None, "Preseason template not found"
        assert preseason["name"] == "Pretemporada", f"Expected name 'Pretemporada', got {preseason['name']}"
        assert preseason["icon"] == "flame", f"Expected icon 'flame', got {preseason['icon']}"
        assert len(preseason["description"]) > 0, "Description should not be empty"
        
        # Check that preseason has drills on weekdays (Mon-Fri) and empty weekends
        active_days = sum(1 for d in preseason["days"] if len(d) > 0)
        assert active_days >= 3, f"Preseason should have at least 3 active days, got {active_days}"
        print(f"PASS: Preseason template verified - {active_days} active days")
    
    def test_recovery_template_details(self):
        """Test recovery template has lighter schedule"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        recovery = next((t for t in templates if t["id"] == "recovery"), None)
        assert recovery is not None, "Recovery template not found"
        assert recovery["name"] == "Recuperación", f"Expected name 'Recuperación', got {recovery['name']}"
        assert recovery["icon"] == "heart", f"Expected icon 'heart', got {recovery['icon']}"
        
        # Recovery should have fewer active days than preseason
        active_days = sum(1 for d in recovery["days"] if len(d) > 0)
        total_drills = sum(len(d) for d in recovery["days"])
        print(f"PASS: Recovery template verified - {active_days} active days, {total_drills} total drills")
    
    def test_matchweek_template_details(self):
        """Test matchweek template has tactical focus"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        matchweek = next((t for t in templates if t["id"] == "matchweek"), None)
        assert matchweek is not None, "Matchweek template not found"
        assert matchweek["name"] == "Semana de Partido", f"Expected name 'Semana de Partido', got {matchweek['name']}"
        assert matchweek["icon"] == "shield", f"Expected icon 'shield', got {matchweek['icon']}"
        
        # Check for tactical drills
        all_drills = [d for day in matchweek["days"] for d in day]
        tactical_drills = [d for d in all_drills if d.get("category") == "tactical"]
        assert len(tactical_drills) > 0, "Matchweek should have tactical drills"
        print(f"PASS: Matchweek template verified - {len(tactical_drills)} tactical drills")
    
    def test_technical_template_details(self):
        """Test technical template has technical focus"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        technical = next((t for t in templates if t["id"] == "technical"), None)
        assert technical is not None, "Technical template not found"
        assert technical["name"] == "Técnica Intensiva", f"Expected name 'Técnica Intensiva', got {technical['name']}"
        assert technical["icon"] == "target", f"Expected icon 'target', got {technical['icon']}"
        
        # Check for technical drills
        all_drills = [d for day in technical["days"] for d in day]
        technical_drills = [d for d in all_drills if d.get("category") == "technical"]
        assert len(technical_drills) > 0, "Technical template should have technical drills"
        print(f"PASS: Technical template verified - {len(technical_drills)} technical drills")
    
    def test_goalkeeper_template_details(self):
        """Test goalkeeper template has goalkeeper-specific drills"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        goalkeeper = next((t for t in templates if t["id"] == "goalkeeper"), None)
        assert goalkeeper is not None, "Goalkeeper template not found"
        assert goalkeeper["name"] == "Porteros", f"Expected name 'Porteros', got {goalkeeper['name']}"
        
        # Check for goalkeeper drills
        all_drills = [d for day in goalkeeper["days"] for d in day]
        gk_drills = [d for d in all_drills if d.get("category") == "goalkeeper"]
        assert len(gk_drills) > 0, "Goalkeeper template should have goalkeeper drills"
        print(f"PASS: Goalkeeper template verified - {len(gk_drills)} goalkeeper drills")
    
    def test_template_drill_duration_is_positive(self):
        """Test that all drill durations are positive integers"""
        response = requests.get(f"{BASE_URL}/api/training-plan-templates", headers=self.headers)
        assert response.status_code == 200
        templates = response.json()
        
        for tpl in templates:
            for day_idx, day in enumerate(tpl["days"]):
                for drill in day:
                    duration = drill.get("duration_minutes", 0)
                    assert isinstance(duration, int), f"Duration should be int in {tpl['id']}"
                    assert duration > 0, f"Duration should be positive in {tpl['id']}"
        print("PASS: All drill durations are positive integers")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
