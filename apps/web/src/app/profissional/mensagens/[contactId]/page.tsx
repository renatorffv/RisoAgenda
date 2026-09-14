import { ChatView } from "@/components/messages/ChatView";

export default async function ProfissionalChatPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  return <ChatView basePath="/profissional" contactId={contactId} />;
}
