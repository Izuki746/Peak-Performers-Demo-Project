import ChatMessage from '../ChatMessage';

export default function ChatMessageExample() {
  return (
    <div className="space-y-4 p-6 bg-background max-w-2xl">
      <ChatMessage
        role="user"
        content="Check the status of feeder F-1234"
        timestamp={new Date(Date.now() - 60000)}
      />
      <ChatMessage
        role="assistant"
        content="I've analyzed feeder F-1234 at Westminster Substation. Here's the current status:"
        timestamp={new Date(Date.now() - 55000)}
        data={{
          "Current Load": "87.5 MW",
          "Capacity": "95 MW",
          "Utilization": "92.1%",
          "Status": "CRITICAL",
          "Connected DERs": "12"
        }}
        actions={[
          {
            label: "Activate Recommended DERs",
            variant: "default",
            onClick: () => console.log('Activating DERs')
          },
          {
            label: "View Full Details",
            variant: "outline",
            onClick: () => console.log('View details')
          }
        ]}
      />
      <ChatMessage
        role="user"
        content="Activate the recommended DERs"
        timestamp={new Date(Date.now() - 30000)}
      />
      <ChatMessage
        role="assistant"
        content="Initiating Beckn Protocol workflow to activate 8 recommended DERs for feeder F-1234. This includes 3 battery storage units and 5 demand response resources. Estimated load reduction: 12.5 MW."
        timestamp={new Date(Date.now() - 25000)}
        data={{
          "Beckn Transaction ID": "BKN-2025-001234",
          "DERs Activated": "8",
          "Estimated Reduction": "12.5 MW",
          "Status": "In Progress"
        }}
      />
    </div>
  );
}
