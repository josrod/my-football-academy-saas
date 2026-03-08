#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AcademySaaSAPITester:
    def __init__(self, base_url="https://football-academy-mvp.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                self.failed_tests.append({
                    "name": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:500] if response.text else "No response"
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200] if response.text else 'No response'}")

            return success, {}

        except requests.exceptions.RequestException as e:
            self.failed_tests.append({
                "name": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            print(f"❌ Failed - Request Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "/api/health", 200)

    def test_login(self, email="admin@academy.com", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard(self):
        """Test dashboard endpoint"""
        return self.run_test("Dashboard Data", "GET", "/api/dashboard", 200)

    def test_players_crud(self):
        """Test players CRUD operations"""
        # Get all players
        success, players = self.run_test("Get All Players", "GET", "/api/players", 200)
        if not success:
            return False
            
        print(f"   Found {len(players)} players")
        
        # Test with filters
        self.run_test("Get Players by Category", "GET", "/api/players?category=U12", 200)
        self.run_test("Get Players by Status", "GET", "/api/players?status=active", 200)
        
        # Get first player details if available
        if players and len(players) > 0:
            player_id = players[0]['id']
            self.run_test("Get Player Details", "GET", f"/api/players/{player_id}", 200)
        
        return True

    def test_teams_crud(self):
        """Test teams CRUD operations"""
        success, teams = self.run_test("Get All Teams", "GET", "/api/teams", 200)
        if not success:
            return False
            
        print(f"   Found {len(teams)} teams")
        
        # Get first team details if available
        if teams and len(teams) > 0:
            team_id = teams[0]['id']
            self.run_test("Get Team Details", "GET", f"/api/teams/{team_id}", 200)
        
        return True

    def test_training_sessions(self):
        """Test training sessions endpoints"""
        success, sessions = self.run_test("Get Training Sessions", "GET", "/api/training", 200)
        if not success:
            return False
            
        print(f"   Found {len(sessions)} training sessions")
        
        # Get first session details if available
        if sessions and len(sessions) > 0:
            session_id = sessions[0]['id']
            self.run_test("Get Training Session Details", "GET", f"/api/training/{session_id}", 200)
        
        return True

    def test_matches(self):
        """Test matches endpoints"""
        success, matches = self.run_test("Get Matches", "GET", "/api/matches", 200)
        if not success:
            return False
            
        print(f"   Found {len(matches)} matches")
        
        # Get first match details if available
        if matches and len(matches) > 0:
            match_id = matches[0]['id']
            self.run_test("Get Match Details", "GET", f"/api/matches/{match_id}", 200)
        
        return True

    def test_calendar(self):
        """Test calendar endpoints"""
        return self.run_test("Get Calendar Events", "GET", "/api/calendar", 200)

    def test_scouting(self):
        """Test scouting endpoints"""
        success, evaluations = self.run_test("Get Evaluations", "GET", "/api/scouting", 200)
        if success:
            print(f"   Found {len(evaluations)} evaluations")
        return success

    def test_announcements(self):
        """Test announcements endpoints"""
        success, announcements = self.run_test("Get Announcements", "GET", "/api/announcements", 200)
        if success:
            print(f"   Found {len(announcements)} announcements")
        return success

    def test_parent_portal(self):
        """Test parent portal endpoints"""
        self.run_test("Parent Players", "GET", "/api/parent/players", 200)
        self.run_test("Parent Schedule", "GET", "/api/parent/schedule", 200)
        self.run_test("Parent Announcements", "GET", "/api/parent/announcements", 200)
        return True

    def test_settings(self):
        """Test settings endpoints"""
        return self.run_test("Get Club Settings", "GET", "/api/settings", 200)

    def test_auth_me(self):
        """Test auth me endpoint"""
        return self.run_test("Get Current User", "GET", "/api/auth/me", 200)

def main():
    print("🏆 Academy SaaS API Testing Started")
    print("=" * 50)
    
    # Setup
    tester = AcademySaaSAPITester()
    
    # Test health check first
    health_success, _ = tester.test_health()
    if not health_success:
        print("❌ Health check failed, stopping tests")
        return 1

    # Test login
    if not tester.test_login():
        print("❌ Login failed, stopping authenticated tests")
        return 1

    # Test authenticated endpoints
    tester.test_auth_me()
    tester.test_dashboard()
    tester.test_players_crud()
    tester.test_teams_crud()
    tester.test_training_sessions()
    tester.test_matches()
    tester.test_calendar()
    tester.test_scouting()
    tester.test_announcements()
    tester.test_parent_portal()
    tester.test_settings()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
            print(f"   • {test['name']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())