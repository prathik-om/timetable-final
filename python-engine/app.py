import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from ortools.sat.python import cp_model
from collections import defaultdict
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # This enables CORS for all routes and origins


@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "AI Scheduling Engine is running"})

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate_schedule_endpoint():
    if request.method == 'OPTIONS':
        # Preflight request. Reply successfully:
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    print("Received request to /generate endpoint...")
    
    try:
        request_data = request.get_json()
        print(f"Request data: {request_data}")
        term_id = request_data.get('term_id')
        user_id = request_data.get('user_id')
        scope = request_data.get('scope', 'school')  # Default to full school

        if not term_id:
            print("Missing term_id in request body")
            return jsonify({"error": "Missing term_id in request body"}), 400
        if not user_id:
            print("Missing user_id in request body")
            return jsonify({"error": "Missing user_id in request body"}), 400

        # --- Part 1: DATA FETCHING ---
        print(f"Fetching data for term_id: {term_id} and user_id: {user_id}")
        term_response = supabase.table('terms').select('academic_year_id').eq('id', term_id).eq('user_id', user_id).single().execute()
        print(f"term_response: {term_response}")
        if not term_response.data:
            print(f"No term found for id {term_id} and user_id {user_id}")
            return jsonify({"error": f"No term found for id {term_id} and user_id {user_id}"}), 400
        academic_year_id = term_response.data['academic_year_id']

        # Fetch school_id using the academic_year_id
        school_id_response = supabase.table('academic_years').select('school_id').eq('id', academic_year_id).eq('user_id', user_id).single().execute()
        print(f"school_id_response: {school_id_response}")
        if not school_id_response.data:
            print(f"No academic year found for id {academic_year_id} and user_id {user_id}")
            return jsonify({"error": f"No academic year found for id {academic_year_id} and user_id {user_id}"}), 400
        school_id = school_id_response.data['school_id']

        # Fetch base data
        teachers = supabase.table('teachers').select('*').eq('school_id', school_id).eq('user_id', user_id).execute().data
        print(f"teachers: {teachers}")
        time_slots = supabase.table('time_slots').select('*').eq('school_id', school_id).eq('is_teaching_period', True).eq('user_id', user_id).execute().data
        print(f"time_slots: {time_slots}")
        
        # Initialize query for class sections and offerings with base filters
        class_sections_query = supabase.table('class_sections').select('*').eq('school_id', school_id).eq('user_id', user_id)
        offerings_query = supabase.table('class_offerings').select('*').eq('school_id', school_id).eq('user_id', user_id)

        # Apply scope-based filtering
        if scope == 'grade':
            grade_levels = request_data.get('grade_levels', [])
            print(f"grade_levels: {grade_levels}")
            if not grade_levels:
                print("Missing grade_levels for grade scope")
                return jsonify({"error": "Missing grade_levels for grade scope"}), 400
            class_sections_query = class_sections_query.in_('grade_level', grade_levels)
            
        elif scope == 'class':
            class_section_ids = request_data.get('class_section_ids', [])
            print(f"class_section_ids: {class_section_ids}")
            if not class_section_ids:
                print("Missing class_section_ids for class scope")
                return jsonify({"error": "Missing class_section_ids for class scope"}), 400
            class_sections_query = class_sections_query.in_('id', class_section_ids)
            
        elif scope == 'teacher':
            teacher_ids = request_data.get('teacher_ids', [])
            print(f"teacher_ids: {teacher_ids}")
            if not teacher_ids:
                print("Missing teacher_ids for teacher scope")
                return jsonify({"error": "Missing teacher_ids for teacher scope"}), 400
            teachers = [t for t in teachers if t['id'] in teacher_ids]

        # Execute filtered queries
        class_sections = class_sections_query.execute().data
        print(f"class_sections: {class_sections}")
        class_offerings_response = offerings_query.select('*, subjects(id, name), class_sections(id, name)').eq('term_id', term_id).execute()
        print(f"class_offerings_response: {class_offerings_response}")
        class_offerings = class_offerings_response.data
        print(f"class_offerings: {class_offerings}")
        offering_ids = [offering['id'] for offering in class_offerings]
        print(f"offering_ids: {offering_ids}")
        teaching_assignments = supabase.table('teaching_assignments').select('*, teachers(id, first_name, last_name)').in_('class_offering_id', offering_ids).execute().data
        print(f"teaching_assignments: {teaching_assignments}")
        
        print(f"Data fetched. Preparing CSP model...")

        # --- Part 2: MODEL THE PROBLEM ---
        
        # 2a. Create the solver model
        model = cp_model.CpModel()
        
        # 2b. Create UUID to integer mappings (OR-Tools requires integers)
        time_slot_to_int = {slot['id']: i for i, slot in enumerate(time_slots)}
        int_to_time_slot = {i: slot['id'] for i, slot in enumerate(time_slots)}
        
        # 2c. Create a flat list of individual lessons
        all_lessons_to_schedule = []
        for offering in class_offerings:
            # Find the assignment for this offering
            assignment = next((a for a in teaching_assignments if a['class_offering_id'] == offering['id']), None)
            if not assignment:
                continue  # Skip if no teacher is assigned

            # Get all existing lessons for this offering
            existing_lessons = supabase.table('lessons').select('*').eq('offering_id', offering['id']).execute().data

            # Create/update lesson records as needed
            for i in range(offering['periods_per_week']):
                # Use existing lesson if available, otherwise create new
                lesson = existing_lessons[i] if i < len(existing_lessons) else None
                if not lesson:
                    lesson_data = {
                        'offering_id': offering['id'],
                        'class_section_id': offering['class_section_id'],
                        'teacher_id': assignment['teacher_id'],
                        'subject_name': offering['subjects']['name']
                    }
                    lesson = supabase.table('lessons').insert(lesson_data).execute().data[0]

                all_lessons_to_schedule.append(lesson)

        print(f"Total individual lesson periods to schedule: {len(all_lessons_to_schedule)}")
        
        # 2d. Create decision variables for each lesson
        lesson_vars = {}
        for lesson in all_lessons_to_schedule:
            # Variable domain: indices of all available time slots
            lesson_vars[lesson['id']] = model.NewIntVar(
                0, len(time_slots) - 1, str(lesson['id'])
            )

        # --- Part 3: ADD CONSTRAINTS ---
        print("Adding constraints...")
        
        # 3a. Teacher Clash Constraint
        # Group lessons by teacher
        teacher_lessons = defaultdict(list)
        for lesson in all_lessons_to_schedule:
            teacher_lessons[lesson['teacher_id']].append(lesson_vars[lesson['id']])
        
        # Add AllDifferent constraint for each teacher
        for teacher_id, lesson_vars_list in teacher_lessons.items():
            if len(lesson_vars_list) > 1:
                model.AddAllDifferent(lesson_vars_list)
                print(f"Added teacher constraint for teacher {teacher_id} with {len(lesson_vars_list)} lessons")
        
        # 3b. Class Section Clash Constraint
        # Group lessons by class section
        class_lessons = defaultdict(list)
        for lesson in all_lessons_to_schedule:
            class_lessons[lesson['class_section_id']].append(lesson_vars[lesson['id']])
        
        # Add AllDifferent constraint for each class section
        for class_id, lesson_vars_list in class_lessons.items():
            if len(lesson_vars_list) > 1:
                model.AddAllDifferent(lesson_vars_list)
                print(f"Added class constraint for class {class_id} with {len(lesson_vars_list)} lessons")

        # --- Part 4: SOLVE THE MODEL ---
        print("Solving the model...")
        solver = cp_model.CpSolver()
        
        # Optional: Set solver parameters
        solver.parameters.max_time_in_seconds = 30.0  # 30 second timeout
        solver.parameters.log_search_progress = True
        
        status = solver.Solve(model)
        
        # --- Part 5: PROCESS RESULTS ---
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            print(f"Solution found! Status: {solver.StatusName(status)}")
            
            # First, create a simple map for easy lookup of slot details by ID
            time_slot_map = {slot['id']: slot for slot in time_slots}

            # Create a daily-sorted list of teaching slots to determine period numbers
            daily_slots = {}
            for slot in time_slots:
                if slot['is_teaching_period']:
                    if slot['day_of_week'] not in daily_slots:
                        daily_slots[slot['day_of_week']] = []
                    daily_slots[slot['day_of_week']].append(slot)
            
            # Sort each day's slots by start time
            for day in daily_slots:
                daily_slots[day].sort(key=lambda x: x['start_time'])

            # Now, build the solution
            timetable_solution = []
            
            for lesson in all_lessons_to_schedule:
                assigned_slot_index = solver.Value(lesson_vars[lesson['id']])
                # Get the assigned time slot directly from the time_slots list
                assigned_time_slot = time_slots[assigned_slot_index]
                
                # Calculate the period number based on its position in the sorted list for that day
                day_teaching_slots = daily_slots.get(assigned_time_slot['day_of_week'], [])
                try:
                    # The period number is its index + 1
                    period_number = day_teaching_slots.index(assigned_time_slot) + 1
                except ValueError:
                    period_number = 0  # Should not happen if logic is correct

                # Find teacher and class details
                teacher = next(t for t in teachers if t['id'] == lesson['teacher_id'])
                class_offering = next(co for co in class_offerings if co['id'] == lesson['offering_id'])
                class_section = next(cs for cs in class_sections if cs['id'] == class_offering['class_section_id'])
                
                timetable_solution.append({
                    'lesson_id': lesson['id'],  # This is now the real database ID
                    'teacher_name': f"{teacher['first_name']} {teacher['last_name']}",
                    'subject_name': lesson['subject_name'],
                    'class_section_name': f"Grade {class_section['grade_level']} - {class_section['name']}",
                    'time_slot_id': assigned_time_slot['id'],
                    'day': assigned_time_slot['day_of_week'],
                    'period': period_number,
                    'start_time': assigned_time_slot['start_time'],
                    'end_time': assigned_time_slot['end_time']
                })
            
            # Optional: Save to database
            # You could insert the timetable_solution into a 'timetable_entries' table here
            
            print(f"Generated timetable with {len(timetable_solution)} scheduled lessons")
            
            return jsonify({
                "status": "success",
                "message": f"Timetable generated successfully with {len(timetable_solution)} lessons",
                "solver_status": solver.StatusName(status),
                "solve_time": solver.WallTime(),
                "timetable": timetable_solution
            }), 200
            
        else:
            print(f"No solution found. Status: {solver.StatusName(status)}")
            return jsonify({
                "status": "no_solution",
                "message": "No valid timetable could be generated with the current constraints",
                "solver_status": solver.StatusName(status),
                "suggestions": [
                    "Check if there are enough time slots for all required lessons",
                    "Verify that teacher assignments don't create impossible conflicts",
                    "Consider reducing periods_per_week for some subjects"
                ]
            }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"An error occurred: {error_trace}")
        return jsonify({"error": str(e), "trace": error_trace}), 500


# Optional: Add a helper endpoint to check constraint feasibility
@app.route('/check-feasibility', methods=['POST'])
def check_feasibility():
    """Check if the scheduling problem is theoretically feasible"""
    try:
        request_data = request.get_json()
        term_id = request_data.get('term_id')
        
        # Fetch the same data
        term_response = supabase.table('terms').select('academic_year_id').eq('id', term_id).single().execute()
        academic_year_id = term_response.data['academic_year_id']

        # Fetch school_id using the academic_year_id
        school_id_response = supabase.table('academic_years').select('school_id').eq('id', academic_year_id).single().execute()
        school_id = school_id_response.data['school_id']
        
        time_slots = supabase.table('time_slots').select('*').eq('school_id', school_id).eq('is_teaching_period', True).execute().data
        class_offerings_response = supabase.table('class_offerings').select('*, subjects(id, name)').eq('term_id', term_id).execute()
        class_offerings = class_offerings_response.data
        
        # Calculate total periods needed
        total_periods_needed = sum(offering['periods_per_week'] for offering in class_offerings)
        total_time_slots = len(time_slots)
        
        # Basic feasibility check
        is_feasible = total_periods_needed <= total_time_slots
        
        return jsonify({
            "total_periods_needed": total_periods_needed,
            "total_time_slots_available": total_time_slots,
            "is_basically_feasible": is_feasible,
            "utilization_rate": (total_periods_needed / total_time_slots) * 100 if total_time_slots > 0 else 0
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/update-lesson', methods=['POST', 'OPTIONS'])
def update_lesson_endpoint():
    if request.method == 'OPTIONS':
        # Preflight request. Reply successfully:
        response = app.make_default_options_response()
        
        # Add Access-Control headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        request_data = request.get_json()
        print("Received update request data:", request_data)
        
        term_id = request_data.get('term_id')
        lesson_id = request_data.get('lesson_id')
        new_day = request_data.get('new_day')
        new_start_time = request_data.get('new_start_time')
        
        print(f"Parsed values: term_id={term_id}, lesson_id={lesson_id}, new_day={new_day}, new_start_time={new_start_time}")

        if not all([term_id, lesson_id, new_day, new_start_time]):
            return jsonify({"error": "Missing required fields"}), 400

        # Get the current time slot duration to calculate end time
        school_id = supabase.table('terms').select('school_id').eq('id', term_id).single().execute().data['school_id']
        time_slots = supabase.table('time_slots').select('*').eq('school_id', school_id).eq('is_teaching_period', True).execute().data

        # Find a matching time slot for the new time
        matching_slot = next(
            (slot for slot in time_slots 
             if slot['day_of_week'] == new_day and 
             slot['start_time'] == new_start_time),
            None
        )

        if not matching_slot:
            return jsonify({"error": "Invalid time slot"}), 400

        # Get the current assignments
        lesson = supabase.table('lessons').select('*').eq('id', lesson_id).single().execute().data
        if not lesson:
            return jsonify({"error": "Lesson not found"}), 404

        # Update the lesson with new time slot
        supabase.table('lessons').update({
            'time_slot_id': matching_slot['id']
        }).eq('id', lesson_id).execute()

        # Return the updated timetable
        return generate_schedule_endpoint()

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"An error occurred: {error_trace}")
        return jsonify({"error": str(e), "trace": error_trace}), 500


if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port)