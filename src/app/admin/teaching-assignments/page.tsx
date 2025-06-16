import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TeachingAssignmentsClient from './_components/TeachingAssignmentsClient';

export const dynamic = 'force-dynamic';

export default async function TeachingAssignmentsPage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get the user's school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (schoolError || !school) {
    redirect('/admin/school-profile');
  }

  try {
    // Fetch all required data in parallel
    const [
      { data: classOfferings, error: classOfferingsError },
      { data: teachers, error: teachersError },
      { data: teachingAssignments, error: assignmentsError },
      { data: qualifications, error: qualificationsError }
    ] = await Promise.all([
      // Fetch class offerings
      supabase
        .from('class_offerings')
        .select(`
          id,
          periods_per_week,
          term:terms (
            id,
            name,
            start_date,
            end_date
          ),
          class_section:class_sections (
            id,
            name,
            grade_level
          ),
          subject:subjects (
            id,
            name,
            code
          )
        `)
        .eq('school_id', school.id),
      
      // Fetch teachers
      supabase
        .from('teachers')
        .select('*')
        .eq('user_id', user.id)
        .order('last_name'),
      
      // Fetch teaching assignments
      supabase
        .from('teaching_assignments')
        .select(`
          id,
          class_offering:class_offerings (
            id,
            periods_per_week,
            term:terms (
              id,
              name,
              start_date,
              end_date
            ),
            class_section:class_sections (
              id,
              name,
              grade_level
            ),
            subject:subjects (
              id,
              name,
              code
            )
          ),
          teacher:teachers (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', school.id),
      
      // Fetch teacher qualifications
      supabase
        .from('teacher_qualifications')
        .select(`
          id,
          teacher_id,
          subject_id
        `)
        .eq('school_id', school.id)
    ]);

    // Check for any errors
    if (classOfferingsError) throw classOfferingsError;
    if (teachersError) throw teachersError;
    if (assignmentsError) throw assignmentsError;
    if (qualificationsError) throw qualificationsError;

    // Calculate validation metrics for assignments
    const totalAssignments = (teachingAssignments || []).length;
    const assignmentsWithValidClassOffering = (teachingAssignments || []).filter(
      a => a.class_offering && a.class_offering.id
    ).length;
    const assignmentsWithValidTeacher = (teachingAssignments || []).filter(
      a => a.teacher && a.teacher.id
    ).length;

    // Calculate validation metrics for class offerings
    const totalClassOfferings = (classOfferings || []).length;
    const classOfferingsWithValidTerm = (classOfferings || []).filter(
      co => co.term && co.term.id
    ).length;
    const classOfferingsWithValidClassSection = (classOfferings || []).filter(
      co => co.class_section && co.class_section.id
    ).length;
    const classOfferingsWithValidSubject = (classOfferings || []).filter(
      co => co.subject && co.subject.id
    ).length;

    // Calculate validation metrics for teachers
    const totalTeachers = (teachers || []).length;
    const teachersWithQualifications = new Set(
      (qualifications || []).map(q => q.teacher_id)
    ).size;

    // Data validation object
    const dataValidation = {
      assignments: {
        total: totalAssignments,
        withValidClassOffering: assignmentsWithValidClassOffering,
        withValidTeacher: assignmentsWithValidTeacher
      },
      classOfferings: {
        total: totalClassOfferings,
        withValidTerm: classOfferingsWithValidTerm,
        withValidClassSection: classOfferingsWithValidClassSection,
        withValidSubject: classOfferingsWithValidSubject
      },
      teachers: {
        total: totalTeachers,
        withQualifications: teachersWithQualifications
      },
      qualifications: {
        total: (qualifications || []).length,
        uniqueTeachers: teachersWithQualifications,
        uniqueSubjects: new Set((qualifications || []).map(q => q.subject_id)).size
      }
    };

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Teaching Assignments</h1>
        <TeachingAssignmentsClient
          classOfferings={classOfferings || []}
          teachers={teachers || []}
          assignments={teachingAssignments || []}
          qualifications={qualifications || []}
          dataValidation={dataValidation}
          schoolId={school.id}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>Failed to load teaching assignments. Please try again later.</p>
      </div>
    );
  }
}
