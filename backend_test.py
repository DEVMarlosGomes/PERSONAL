import requests
import sys
import json
import io
import pandas as pd
from datetime import datetime

class PersonalTrainerAPITester:
    def __init__(self, base_url="https://efficient-push-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.personal_token = None
        self.student_token = None
        self.existing_student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_student_id = None
        self.created_workout_id = None
        self.created_assessment_id = None
        self.created_routine_id = None
        self.created_exercise_id = None
        self.created_payment_id = None
        self.existing_student_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    test_headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_personal_registration(self):
        """Test personal trainer registration"""
        test_data = {
            "name": "João Silva",
            "email": f"personal_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Personal Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.personal_token = response['access_token']
            print(f"   Personal token obtained: {self.personal_token[:20]}...")
            return True, response['user']
        return False, {}

    def test_personal_login(self, email, password):
        """Test personal trainer login"""
        success, response = self.run_test(
            "Personal Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.personal_token = response['access_token']
            return True, response['user']
        return False, {}

    def test_get_me(self):
        """Test get current user info"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        return success, response

    def test_create_student(self):
        """Test creating a student"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        test_data = {
            "name": "Maria Santos",
            "email": f"student_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "StudentPass123!",
            "phone": "(11) 99999-9999",
            "notes": "Aluna iniciante"
        }
        
        success, response = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=test_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_student_id = response['id']
            print(f"   Student created with ID: {self.created_student_id}")
            return True, response
        return False, {}

    def test_list_students(self):
        """Test listing students"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "List Students",
            "GET",
            "students",
            200,
            headers=headers
        )
        return success, response

    def test_get_student(self):
        """Test getting specific student"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Get Student",
            "GET",
            f"students/{self.created_student_id}",
            200,
            headers=headers
        )
        return success, response

    def test_update_student(self):
        """Test updating student"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        update_data = {
            "name": "Maria Santos Silva",
            "phone": "(11) 88888-8888",
            "notes": "Aluna com progresso excelente"
        }
        
        success, response = self.run_test(
            "Update Student",
            "PUT",
            f"students/{self.created_student_id}",
            200,
            data=update_data,
            headers=headers
        )
        return success, response

    def test_upload_workout(self):
        """Test uploading workout XLS file"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        # Create a sample Excel file
        workout_data = {
            'Dia': ['Segunda', 'Segunda', 'Terça', 'Terça'],
            'Grupo Muscular': ['Peito', 'Tríceps', 'Costas', 'Bíceps'],
            'Exercício': ['Supino Reto', 'Tríceps Pulley', 'Puxada Frontal', 'Rosca Direta'],
            'Séries': [4, 3, 4, 3],
            'Repetições': ['8-12', '10-15', '8-12', '10-15'],
            'Carga': ['60kg', '30kg', '50kg', '20kg'],
            'Observações': ['Foco na técnica', 'Controle na descida', 'Pegada pronada', 'Movimento controlado']
        }
        
        df = pd.DataFrame(workout_data)
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('treino_teste.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        data = {'student_id': self.created_student_id}
        
        success, response = self.run_test(
            "Upload Workout",
            "POST",
            "workouts/upload",
            200,
            data=data,
            files=files,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_workout_id = response['id']
            print(f"   Workout created with ID: {self.created_workout_id}")
            return True, response
        return False, {}

    def test_list_workouts(self):
        """Test listing workouts"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "List Workouts",
            "GET",
            "workouts",
            200,
            headers=headers
        )
        return success, response

    def test_get_workout(self):
        """Test getting specific workout"""
        if not self.created_workout_id:
            print("❌ No workout ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Get Workout",
            "GET",
            f"workouts/{self.created_workout_id}",
            200,
            headers=headers
        )
        return success, response

    def test_student_login(self, email, password):
        """Test student login"""
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            print(f"   Student token obtained: {self.student_token[:20]}...")
            return True, response['user']
        return False, {}

    def test_student_workouts(self):
        """Test student viewing workouts"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        success, response = self.run_test(
            "Student View Workouts",
            "GET",
            "workouts",
            200,
            headers=headers
        )
        return success, response

    def test_log_progress(self):
        """Test logging progress"""
        if not self.created_workout_id:
            print("❌ No workout ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.student_token}'}
        progress_data = {
            "workout_id": self.created_workout_id,
            "exercise_name": "Supino Reto",
            "sets_completed": [
                {"set": 1, "weight": 60, "reps": 10},
                {"set": 2, "weight": 60, "reps": 8},
                {"set": 3, "weight": 55, "reps": 12}
            ],
            "notes": "Treino excelente hoje!"
        }
        
        success, response = self.run_test(
            "Log Progress",
            "POST",
            "progress",
            200,
            data=progress_data,
            headers=headers
        )
        return success, response

    def test_get_progress(self):
        """Test getting progress"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        success, response = self.run_test(
            "Get Progress",
            "GET",
            "progress",
            200,
            headers=headers
        )
        return success, response

    def test_get_evolution(self):
        """Test getting evolution data"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        success, response = self.run_test(
            "Get Evolution",
            "GET",
            "progress/evolution?exercise_name=Supino Reto",
            200,
            headers=headers
        )
        return success, response

    def test_get_notifications(self):
        """Test getting notifications"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200,
            headers=headers
        )
        return success, response

    def test_personal_stats(self):
        """Test personal trainer stats"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Personal Stats",
            "GET",
            "stats/personal",
            200,
            headers=headers
        )
        return success, response

    def test_student_stats(self):
        """Test student stats"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        success, response = self.run_test(
            "Student Stats",
            "GET",
            "stats/student",
            200,
            headers=headers
        )
        return success, response

    # ==================== FITMASTER NEW FEATURES TESTS ====================
    
    def test_create_physical_assessment(self):
        """Test creating physical assessment"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        assessment_data = {
            "student_id": self.created_student_id,
            "assessment_type": "manual",
            "date": "2024-01-15",
            "weight": 75.5,
            "height": 175.0,
            "body_fat_percentage": 15.2,
            "muscle_mass": 45.8,
            "chest": 95.0,
            "waist": 80.0,
            "hip": 98.0,
            "arm_right": 35.0,
            "arm_left": 34.5,
            "thigh_right": 58.0,
            "thigh_left": 57.5,
            "notes": "Primeira avaliação física do aluno"
        }
        
        success, response = self.run_test(
            "Create Physical Assessment",
            "POST",
            "assessments",
            200,
            data=assessment_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_assessment_id = response['id']
            print(f"   Assessment created with ID: {self.created_assessment_id}")
            return True, response
        return False, {}

    def test_list_assessments(self):
        """Test listing assessments for a student"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "List Assessments",
            "GET",
            f"assessments?student_id={self.created_student_id}",
            200,
            headers=headers
        )
        return success, response

    def test_compare_assessments(self):
        """Test comparing assessments"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Compare Assessments",
            "GET",
            f"assessments/compare/{self.created_student_id}",
            200,
            headers=headers
        )
        return success, response

    def test_create_training_routine(self):
        """Test creating training routine"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        routine_data = {
            "student_id": self.created_student_id,
            "name": "Rotina Hipertrofia - Semana 1",
            "start_date": "2024-01-15",
            "end_date": "2024-02-15",
            "objective": "Hipertrofia",
            "level": "Intermediário",
            "day_type": "Por Dia da Semana",
            "auto_archive": True,
            "notes": "Rotina focada em hipertrofia muscular"
        }
        
        success, response = self.run_test(
            "Create Training Routine",
            "POST",
            "routines",
            200,
            data=routine_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_routine_id = response['id']
            print(f"   Routine created with ID: {self.created_routine_id}")
            return True, response
        return False, {}

    def test_list_routines(self):
        """Test listing training routines"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "List Training Routines",
            "GET",
            "routines",
            200,
            headers=headers
        )
        return success, response

    def test_clone_routine(self):
        """Test cloning training routine"""
        if not self.created_routine_id or not self.created_student_id:
            print("❌ No routine ID or student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Clone Training Routine",
            "POST",
            f"routines/{self.created_routine_id}/clone?student_id={self.created_student_id}",
            200,
            headers=headers
        )
        return success, response

    def test_get_exercise_categories(self):
        """Test getting exercise categories"""
        success, response = self.run_test(
            "Get Exercise Categories",
            "GET",
            "exercise-library/categories",
            200
        )
        return success, response

    def test_list_exercise_library(self):
        """Test listing exercises from library"""
        success, response = self.run_test(
            "List Exercise Library",
            "GET",
            "exercise-library",
            200
        )
        return success, response

    def test_create_custom_exercise(self):
        """Test creating custom exercise"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        exercise_data = {
            "name": "Supino Inclinado com Halteres",
            "category": "PEITORAL",
            "description": "Exercício para desenvolvimento do peitoral superior",
            "instructions": "Deite no banco inclinado, segure os halteres e execute o movimento",
            "muscles_worked": ["Peitoral Superior", "Deltóide Anterior", "Tríceps"]
        }
        
        success, response = self.run_test(
            "Create Custom Exercise",
            "POST",
            "exercise-library",
            200,
            data=exercise_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_exercise_id = response['id']
            print(f"   Exercise created with ID: {self.created_exercise_id}")
            return True, response
        return False, {}

    def test_create_financial_payment(self):
        """Test creating financial payment"""
        if not self.created_student_id:
            print("❌ No student ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        payment_data = {
            "student_id": self.created_student_id,
            "amount": 150.00,
            "due_date": "2024-01-31",
            "status": "pending",
            "payment_method": "PIX",
            "notes": "Mensalidade Janeiro 2024"
        }
        
        success, response = self.run_test(
            "Create Financial Payment",
            "POST",
            "financial/payments",
            200,
            data=payment_data,
            headers=headers
        )
        
        if success and 'id' in response:
            self.created_payment_id = response['id']
            print(f"   Payment created with ID: {self.created_payment_id}")
            return True, response
        return False, {}

    def test_list_financial_payments(self):
        """Test listing financial payments"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "List Financial Payments",
            "GET",
            "financial/payments",
            200,
            headers=headers
        )
        return success, response

    def test_financial_summary(self):
        """Test getting financial summary"""
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Get Financial Summary",
            "GET",
            "financial/summary",
            200,
            headers=headers
        )
        return success, response

    def test_mark_payment_as_paid(self):
        """Test marking payment as paid"""
        if not self.created_payment_id:
            print("❌ No payment ID available for testing")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        update_data = {
            "status": "paid",
            "payment_date": "2024-01-25",
            "payment_method": "PIX"
        }
        
        success, response = self.run_test(
            "Mark Payment as Paid",
            "PUT",
            f"financial/payments/{self.created_payment_id}",
            200,
            data=update_data,
            headers=headers
        )
        return success, response

    def test_existing_student_login(self):
        """Test login with existing student"""
        success, response = self.run_test(
            "Existing Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": "joao@test.com", "password": "test123"}
        )
        
        if success and 'access_token' in response:
            self.existing_student_token = response['access_token']
            self.existing_student_id = response['user']['id']
            print(f"   Existing student token obtained: {self.existing_student_token[:20]}...")
            return True, response['user']
        return False, {}

def main():
    print("🏋️ Personal Trainer API Testing Started")
    print("=" * 50)
    
    tester = PersonalTrainerAPITester()
    
    # Test Personal Registration and Login
    print("\n📋 TESTING PERSONAL TRAINER FLOW")
    success, personal_user = tester.test_personal_registration()
    if not success:
        print("❌ Personal registration failed, stopping tests")
        return 1
    
    # Test auth endpoints
    tester.test_get_me()
    
    # Test student management
    print("\n👥 TESTING STUDENT MANAGEMENT")
    success, student_data = tester.test_create_student()
    if not success:
        print("❌ Student creation failed")
        return 1
    
    tester.test_list_students()
    tester.test_get_student()
    tester.test_update_student()
    
    # Test workout management
    print("\n💪 TESTING WORKOUT MANAGEMENT")
    success, workout_data = tester.test_upload_workout()
    if not success:
        print("❌ Workout upload failed")
        return 1
    
    tester.test_list_workouts()
    tester.test_get_workout()
    
    # Test student login and workflow
    print("\n🎓 TESTING STUDENT FLOW")
    success, student_user = tester.test_student_login(student_data['email'], "StudentPass123!")
    if not success:
        print("❌ Student login failed")
        return 1
    
    tester.test_student_workouts()
    tester.test_log_progress()
    tester.test_get_progress()
    tester.test_get_evolution()
    tester.test_get_notifications()
    
    # Test stats
    print("\n📊 TESTING STATISTICS")
    tester.test_personal_stats()
    tester.test_student_stats()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend API tests PASSED")
        return 0
    else:
        print("❌ Backend API tests FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())