import ChatbotPanel from '../ChatbotPanel';

export default function ChatbotPanelExample() {
  return (
    <div className="h-[600px] p-6 bg-background">
      <ChatbotPanel
        onSendMessage={(msg) => console.log('Sent:', msg)}
        isProcessing={false}
      />
    </div>
  );
}
