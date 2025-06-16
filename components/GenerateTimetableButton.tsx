import { useState } from 'react';

interface GenerateTimetableButtonProps {
  termId: string;
  scope?: 'school' | 'grade' | 'class' | 'teacher';
  gradeLevel?: string[];
  classSectionIds?: string[];
  teacherIds?: string[];
}

export default function GenerateTimetableButton({
  termId,
  scope = 'school',
  gradeLevel,
  classSectionIds,
  teacherIds,
}: GenerateTimetableButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const requestBody = {
        term_id: termId,
        scope,
        ...(scope === 'grade' && { grade_levels: gradeLevel }),
        ...(scope === 'class' && { class_section_ids: classSectionIds }),
        ...(scope === 'teacher' && { teacher_ids: teacherIds }),
      };

      const res = await fetch('http://localhost:5002/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to connect to scheduling engine.' });
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading || (scope !== 'school' && (
          (scope === 'grade' && !gradeLevel?.length) ||
          (scope === 'class' && !classSectionIds?.length) ||
          (scope === 'teacher' && !teacherIds?.length)
        ))}
      >
        {loading ? 'Generating...' : 'Generate Timetable'}
      </button>
      {result && (
        <pre style={{ marginTop: 16, background: '#eee', padding: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
