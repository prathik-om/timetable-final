import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeachingAssignmentsClient from './_components/TeachingAssignmentsClient';

export default async function TeachingAssignmentsPage() {
  const cookieStore = cookies();
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get the first school (since we don't have user_id anymore)
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('id')
    .limit(1)
    .single();

  if (schoolError || !schoolData) {
    redirect('/admin/school-profile');
  }

  try {
    // First, fetch all class offerings to ensure we have the base data
    const { data: classOfferings, error: classOfferingsError } = await supabase
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
          name
        )
      `)
      .eq('school_id', schoolData.id);

    if (classOfferingsError) {
      console.error('Error fetching class offerings:', classOfferingsError);
      throw new Error('Failed to fetch class offerings');
    }

    // Then fetch teaching assignments with all related data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teaching_assignments')
      .select(`
        id,
        class_offering_id,
        teacher_id,
        school_id,
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
            name
          )
        ),
        teacher:teachers (
          id,
          first_name,
          last_name
        )
      `)
      .eq('school_id', schoolData.id);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw new Error('Failed to fetch assignments');
    }

    // Fetch teachers and qualifications
    const [
      { data: teachers, error: teachersError },
      { data: qualifications, error: qualificationsError }
    ] = await Promise.all([
      supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolData.id),
      supabase
        .from('teacher_qualifications')
        .select('*')
        .eq('school_id', schoolData.id)
    ]);

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
      throw new Error('Failed to fetch teachers');
    }

    if (qualificationsError) {
      console.error('Error fetching qualifications:', qualificationsError);
      throw new Error('Failed to fetch qualifications');
    }

    // Validate and log data consistency
    const dataValidation = {
      assignments: {
        total: assignments?.length || 0,
        withValidClassOffering: assignments?.filter(a => a.class_offering)?.length || 0,
        withValidTeacher: assignments?.filter(a => a.teacher)?.length || 0,
      },
      classOfferings: {
        total: classOfferings?.length || 0,
        withValidTerm: classOfferings?.filter(o => o.term)?.length || 0,
        withValidClassSection: classOfferings?.filter(o => o.class_section)?.length || 0,
        withValidSubject: classOfferings?.filter(o => o.subject)?.length || 0,
      },
      teachers: {
        total: teachers?.length || 0,
      },
      qualifications: {
        total: qualifications?.length || 0,
      }
    };

    console.log('Data Validation:', dataValidation);

    // Log any data inconsistencies
    if (dataValidation.assignments.total > 0) {
      if (dataValidation.assignments.withValidClassOffering < dataValidation.assignments.total) {
        console.warn('Some assignments have missing class offering data');
      }
      if (dataValidation.assignments.withValidTeacher < dataValidation.assignments.total) {
        console.warn('Some assignments have missing teacher data');
      }
    }

    if (dataValidation.classOfferings.total > 0) {
      if (dataValidation.classOfferings.withValidTerm < dataValidation.classOfferings.total) {
        console.warn('Some class offerings have missing term data');
      }
      if (dataValidation.classOfferings.withValidClassSection < dataValidation.classOfferings.total) {
        console.warn('Some class offerings have missing class section data');
      }
      if (dataValidation.classOfferings.withValidSubject < dataValidation.classOfferings.total) {
        console.warn('Some class offerings have missing subject data');
      }
    }

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Teaching Assignments</h1>
        <TeachingAssignmentsClient
          assignments={assignments || []}
          classOfferings={classOfferings || []}
          teachers={teachers || []}
          qualifications={qualifications || []}
          schoolId={schoolData.id}
          dataValidation={dataValidation}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in TeachingAssignmentsPage:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Assignments</h2>
          <p className="text-red-600 mt-2">
            There was an error loading the teaching assignments. Please try refreshing the page.
          </p>
          <pre className="mt-4 text-sm text-red-500 bg-red-50 p-2 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    );
  }
} 