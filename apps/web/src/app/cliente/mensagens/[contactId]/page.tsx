import { ChatView } from "@/components/messages/ChatView";

export default async function ClienteChatPage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  return <ChatView basePath="/cliente" contactId={contactId} />;
}
