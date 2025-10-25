'use client';

import { useRouter } from 'next/navigation';
import { sidebarConfig } from '@/lib/config';
import { TopicCard } from './TopicCard';

export function MarketsGrid() {
  const router = useRouter();

  const handleTopicClick = (topicId: string) => {
    // 点击跳回主页
    router.push('/');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sidebarConfig.topics.map((topic) => (
        <TopicCard 
          key={topic.id} 
          topic={topic} 
          onClick={() => handleTopicClick(topic.id)}
        />
      ))}
    </div>
  );
}