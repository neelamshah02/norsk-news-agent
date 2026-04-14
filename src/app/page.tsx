import TopicInput from '@/components/TopicInput';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Norsk Nyhetsagent
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Lær norsk gjennom aktuelle nyheter
        </p>
        <TopicInput />
      </div>
    </main>
  );
}
