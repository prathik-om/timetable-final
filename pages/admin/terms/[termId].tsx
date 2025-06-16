import { useRouter } from 'next/router';
import GenerateTimetableButton from '../../../components/GenerateTimetableButton';

export default function TermPage() {
  const router = useRouter();
  const { termId } = router.query;

  if (!termId) return <div>Loading...</div>;

  return (
    <div>
      <h1>Term: {termId}</h1>
      <GenerateTimetableButton termId={termId as string} />
    </div>
  );
}
