import { useState } from "react";
import NavigationRail from "@/components/sidebar/NavigationRail";
import ChatListSidebar from "@/components/chat/ChatListSidebar";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import CallModal from "@/components/chat/CallModal";
import IncomingCallModal from "@/components/chat/IncomingCallModal";
import KyetoCloudChatPanel from "@/components/sidebar/KyetoCloudChatPanel";

const ChatAppPage = () => {
  const [activeTab, setActiveTab] = useState("chats");

  const isCloudTab = activeTab === "cloud";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* Column 1: Ultra-slim Navigation Rail (~72px width) */}
      <NavigationRail activeTab={activeTab} setActiveTab={setActiveTab} />

      {isCloudTab ? (
        /* Kyeto Cloud: Full width self-chat panel (no sidebar) */
        <main className="flex-1 h-full overflow-hidden min-w-0 relative">
          <KyetoCloudChatPanel />
        </main>
      ) : (
        <>
          {/* Column 2: Conversation List Sidebar (~320px width) */}
          <ChatListSidebar />

          {/* Column 3 & 4: Main Chat Window + Right Info Drawer */}
          <main className="flex-1 flex h-full overflow-hidden min-w-0">
            <ChatWindowLayout />
          </main>
        </>
      )}

      {/* WebRTC Call Modals */}
      <CallModal />
      <IncomingCallModal />
    </div>
  );
};

export default ChatAppPage;
