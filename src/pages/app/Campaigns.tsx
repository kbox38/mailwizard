/**
 * Campaigns Page
 *
 * Campaign management with advanced recipient selection and status tracking.
 *
 * FEATURES:
 * - Display campaign status (Draft, Scheduled, Sending, Sent, Cancelled)
 * - Show email metrics (opens, clicks, bounces)
 * - Advanced recipient selection (groups + contacts)
 * - Real-time recipient count preview
 * - Campaign cancellation during sending
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Mail,
  Send,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Play,
  Users,
  XCircle,
  Monitor,
  Smartphone,
} from "lucide-react";
import { AppLayout } from "../../components/app/AppLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { useLocation } from 'react-router-dom';
import CreateCampaignModal from "../../components/campaigns/CreateCampaignModal";
import { EditCampaignModal } from '../../components/campaigns/EditCampaignModal';
import { DeleteConfirmModal } from '../../components/campaigns/DeleteConfirmModal';
import { injectResponsiveStyles } from '../../utils/emailResponsive';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: { html: string };
  custom_html: { html: string };
  status: string;
  recipients_count: number;
  opens: number;
  clicks: number;
  bounces: number;
  sent_at: string | null;
  created_at: string;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  emails_sent_before_cancel?: number;
}

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
}

type SendMode = "all" | "groups" | "contacts" | "mixed";

export function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [sending, setSending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingDraftCampaign, setEditingDraftCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingNow, setSendingNow] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Send modal state
  const [sendMode, setSendMode] = useState<SendMode>("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [recipientCount, setRecipientCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [isReturningFromTemplate, setIsReturningFromTemplate] = useState(false);
  const [preselectedTemplate, setPreselectedTemplate] = useState<{ id: string; html: string; name: string; content?: any } | null>(null);


  // View details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsCampaign, setDetailsCampaign] = useState<Campaign | null>(null);
  const [detailsPreviewMobile, setDetailsPreviewMobile] = useState(false);
  const location = useLocation();

  // Add this useEffect in Campaigns component
// In Campaigns.tsx - Replace the detection useEffect

useEffect(() => {
  console.log('🔍 Campaigns page mounted, checking for resumeCampaign flag');
  
  const urlParams = new URLSearchParams(window.location.search);
  const resumeCampaign = urlParams.get('resumeCampaign');
  
  console.log('🏷️ resumeCampaign parameter:', resumeCampaign);
  
  if (resumeCampaign === 'true') {
    console.log('✅ Detected return from template editor!');
    
    // Check if data exists in sessionStorage
    const campaignDraft = sessionStorage.getItem('campaignDraft');
    const editedTemplate = sessionStorage.getItem('editedTemplate');
    
    console.log('📦 campaignDraft exists:', !!campaignDraft);
    console.log('📦 editedTemplate exists:', !!editedTemplate);
    
    if (campaignDraft && editedTemplate) {
      console.log('✅ Both data pieces found, reopening modal...');
      setIsReturningFromTemplate(true);
      
      // Small delay to ensure state is set
      setTimeout(() => {
        setShowCreateModal(true);
        console.log('✅ Modal opened');
      }, 50);
    } else {
      console.warn('⚠️ Missing sessionStorage data, cannot restore');
      toast.error('Campaign data was lost. Please start over.');
    }
    
    // Clean up URL without page reload
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('🧹 URL cleaned up');
  }
}, []);


  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchContacts();
      fetchGroups();
      // Trigger processing of any due scheduled campaigns in the background
      supabase.functions.invoke('process-scheduled-campaigns').then(() => {
        fetchCampaigns();
      }).catch(() => { /* cron function may not be deployed yet */ });
    }
  }, [user]);

  // Update recipient count when selections change
  useEffect(() => {
    if (showSendModal) {
      updateRecipientCount();
    }
  }, [sendMode, selectedGroups, selectedContacts, showSendModal]);

 useEffect(() => {
  if (location.state?.completedTemplate) {
    console.log('📧 Detected completed template, auto-opening modal');
    setIsReturningFromTemplate(true);
    setShowCreateModal(true);
  }
  if (location.state?.preselectedTemplate) {
    console.log('📧 Detected preselected template from Templates page, opening campaign modal');
    setPreselectedTemplate(location.state.preselectedTemplate);
    setModalKey(prev => prev + 1);
    setShowCreateModal(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, [location.state]);


  const fetchCampaigns = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  /**
 * Handle edit campaign
 */
const handleEdit = (campaign: Campaign) => {
  console.log('📝 Edit clicked for campaign:', campaign.name, 'Status:', campaign.status);
  
  if (campaign.status === 'draft') {
    // ✅ Route draft campaigns to full CreateCampaignModal
    console.log('✅ Opening CreateCampaignModal for draft campaign');
    setEditingDraftCampaign(campaign);
  } else if (campaign.status === 'scheduled') {
    // ✅ Keep existing behavior for scheduled campaigns
    console.log('✅ Opening EditCampaignModal for scheduled campaign');
    setEditingCampaign(campaign);
  } else {
    // Sent campaigns should not be editable
    toast.error('Cannot edit campaigns that have already been sent');
  }
};

/**
 * Handle delete campaign
 */
const handleDelete = async () => {
  if (!deletingCampaign) return;
  
  setIsDeleting(true);
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', deletingCampaign.id);

    if (error) throw error;

    toast.success('Campaign deleted successfully');
    setDeletingCampaign(null);
    fetchCampaigns();
  } catch (error: any) {
    console.error('Failed to delete campaign:', error);
    toast.error(error.message || 'Failed to delete campaign');
  } finally {
    setIsDeleting(false);
  }
};

/**
 * Handle send now
 */
const handleSendNow = async (campaign: Campaign) => {
  // Just delegate to handleQuickSend which has all the logic
  handleQuickSend(campaign);
};

/**
 * Handle cancel campaign
 */
const handleCancelCampaign = async (campaign: Campaign) => {
  if (!user) return;

  // Confirmation dialog
  const confirmed = confirm(
    `⚠️ Cancel Campaign?\n\n` +
    `Campaign: "${campaign.name}"\n` +
    `Status: Sending in progress\n\n` +
    `This will stop sending to remaining recipients. ` +
    `Emails already sent cannot be recalled.\n\nContinue?`
  );

  if (!confirmed) return;

  setCancelling(campaign.id);
  const toastId = toast.loading('Cancelling campaign...');

  try {
    // Count how many emails were already sent
    const { count: emailsSent } = await supabase
      .from('email_events')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('event_type', 'sent');

    // Update campaign to cancelled status
    const { error } = await supabase
      .from('campaigns')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        emails_sent_before_cancel: emailsSent || 0
      })
      .eq('id', campaign.id);

    if (error) throw error;

    toast.success(
      `Campaign cancelled. ${emailsSent || 0} email${emailsSent === 1 ? '' : 's'} ${emailsSent === 1 ? 'was' : 'were'} sent before cancellation.`,
      { id: toastId }
    );

    // Refresh campaigns list
    await fetchCampaigns();

  } catch (error: any) {
    console.error('Failed to cancel campaign:', error);
    toast.error(error.message || 'Failed to cancel campaign', { id: toastId });
  } finally {
    setCancelling(null);
  }
};

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("email");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contact_groups")
        .select("id, name, description, contact_count")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const handleOpenSendModal = (campaign: Campaign) => {
  setSelectedCampaign(campaign);

  // ✅ FIX #2: Load saved recipients from campaign.content
  const storedRecipients = (campaign as any).content?.recipients;
  
  if (storedRecipients) {
    // Pre-populate the saved recipient selection
    setSendMode(storedRecipients.sendToMode || "all");
    setSelectedGroups(new Set(storedRecipients.selectedGroups || []));
    setSelectedContacts(new Set(storedRecipients.selectedContacts || []));
    
    // Calculate and show recipient count
    let count = 0;
    if (storedRecipients.sendToMode === 'all') {
      count = contacts.filter(c => c.status === 'active').length;
    } else if (storedRecipients.sendToMode === 'contacts') {
      count = storedRecipients.selectedContacts?.length || 0;
    } else if (storedRecipients.sendToMode === 'groups') {
      const groupIds = storedRecipients.selectedGroups || [];
      count = groups
        .filter(g => groupIds.includes(g.id))
        .reduce((sum, g) => sum + g.contact_count, 0);
    }
    
    toast.success(`Recipients loaded: ${count} contacts (${storedRecipients.sendToMode} mode)`);
  } else {
    // Fallback to default (all contacts)
    setSendMode("all");
    setSelectedGroups(new Set());
    setSelectedContacts(new Set());
    toast.info('No saved recipients found. Please select recipients.');
  }

  setShowSendModal(true);
};

  const handleQuickSend = async (campaign: Campaign) => {
  console.log('🚀 handleQuickSend started', { campaignId: campaign.id, campaignName: campaign.name });
  
  const storedRecipients = (campaign as any).content?.recipients;
  console.log('📋 Stored recipients:', storedRecipients);
  
  if (!storedRecipients) {
    console.log('❌ No stored recipients, opening modal');
    handleOpenSendModal(campaign);
    return;
  }

  setSelectedCampaign(campaign);

  // Step 1: Build recipient list
  let recipientList: Contact[] = [];

  try {
    if (storedRecipients.sendToMode === 'all') {
      console.log('📧 Send mode: ALL');
      recipientList = contacts.filter((c) => c.status === "active");
    } else if (storedRecipients.sendToMode === 'contacts') {
      console.log('📧 Send mode: CONTACTS', storedRecipients.selectedContacts);
      recipientList = contacts.filter(
        (c) => storedRecipients.selectedContacts.includes(c.id) && c.status === "active"
      );
    } else if (storedRecipients.sendToMode === 'groups') {
      console.log('📧 Send mode: GROUPS', storedRecipients.selectedGroups);
      const { data: groupMembers, error: groupError } = await supabase
        .from("contact_group_members")
        .select("contact_id")
        .in("group_id", storedRecipients.selectedGroups);

      if (groupError) {
        console.error('❌ Error fetching group members:', groupError);
        toast.error('Failed to fetch group members');
        return;
      }

      if (groupMembers) {
        const contactIds = groupMembers.map((gm) => gm.contact_id);
        recipientList = contacts.filter(
          (c) => contactIds.includes(c.id) && c.status === "active"
        );
      }
    }

    console.log(`✅ Built recipient list: ${recipientList.length} recipients`);

    if (recipientList.length === 0) {
      console.log('❌ No active recipients found');
      toast.error("No active recipients found for this campaign");
      return;
    }

    // Step 2: Validate campaign content
    const campaignHtml = (campaign as any).custom_html || (campaign as any).content?.html;
    console.log('📄 Campaign HTML exists:', !!campaignHtml);
    console.log('📧 Campaign subject:', campaign.subject);

    if (!campaign.subject?.trim()) {
      console.log('❌ Campaign subject is missing');
      toast.error("Campaign subject is missing");
      return;
    }

    if (!campaignHtml?.trim()) {
      console.log('❌ Campaign content is missing');
      toast.error("Campaign content is missing");
      return;
    }

    // Step 3: Confirmation dialog
    const confirmMessage = 
      `📧 Send Campaign Confirmation\n\n` +
      `Campaign: "${campaign.name}"\n` +
      `Subject: "${campaign.subject}"\n` +
      `Recipients: ${recipientList.length} contact${recipientList.length !== 1 ? 's' : ''}\n` +
      `Mode: ${storedRecipients.sendToMode}\n\n` +
      `This will send emails immediately. You can cancel during sending if needed.\n\nContinue?`;
    
    if (!confirm(confirmMessage)) {
      console.log('❌ User cancelled send');
      return;
    }

    console.log('✅ User confirmed send, starting process...');

    // Step 4: Hand off to the server-side batch sender.
    // Sending no longer runs in this browser tab — the Edge Function sends the
    // whole list via SendGrid's batch API, so it completes even if this tab is
    // closed, and thousands of emails go out in seconds instead of stalling.
    setSending(campaign.id);
    const toastId = toast.loading(
      `Starting send to ${recipientList.length} recipient${recipientList.length !== 1 ? 's' : ''}...`
    );

    const { data: result, error: invokeError } = await supabase.functions.invoke('send-campaign', {
      body: { campaign_id: campaign.id },
    });

    if (invokeError || !result?.success) {
      const msg = result?.error || invokeError?.message || 'Failed to send campaign';
      console.error('❌ send-campaign failed:', msg);
      toast.error(`❌ ${msg}`, { id: toastId, duration: 6000 });
    } else {
      // The Edge Function sends in the background and returns right away, so the
      // UI never hangs on big lists. Status moves to 'sending' then 'sent'.
      toast.success(
        '✅ Campaign is sending! Large lists can take a few minutes.',
        { id: toastId, duration: 6000 }
      );
    }

    // Refresh campaigns list
    await fetchCampaigns();

  } catch (error: any) {
    console.error("💥 Critical error in handleQuickSend:", error);
    toast.error(error.message || "Failed to send campaign");
    // Note: campaign status is now owned by the send-campaign Edge Function;
    // we no longer revert it here to avoid clobbering a send that did go out.
  } finally {
    setSending(null);
    console.log('✅ handleQuickSend completed');
  }
};

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const handleSelectAllContacts = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c.id)));
    }
  };

  const getRecipientList = async (): Promise<Contact[]> => {
    if (!user) return [];

    // BUG FIX #3: If campaign has stored recipients, use those
    if (selectedCampaign?.content?.recipients) {
      const storedRecipients = (selectedCampaign as any).content.recipients;
      
      if (storedRecipients.sendToMode === 'all') {
        // Send to all active contacts
        return contacts.filter(c => c.status === 'active');
      } 
      
      if (storedRecipients.sendToMode === 'contacts') {
        // Send to specific contacts
        return contacts.filter(c => 
          storedRecipients.selectedContacts.includes(c.id) && 
          c.status === 'active'
        );
      }
      
      if (storedRecipients.sendToMode === 'groups') {
        // Send to contacts in selected groups
        const { data: groupMembers, error } = await supabase
          .from('contact_group_members')
          .select('contact_id')
          .in('group_id', storedRecipients.selectedGroups);

        if (error) {
          console.error('Error fetching group members:', error);
          return [];
        }

        const contactIds = groupMembers.map(gm => gm.contact_id);
        return contacts.filter(c => 
          contactIds.includes(c.id) && 
          c.status === 'active'
        );
      }
    }

    // Fallback to the current modal selection
    if (sendMode === "all") {
      return contacts.filter((c) => c.status === "active");
    }

    if (sendMode === "groups") {
      const { data: groupMembers, error } = await supabase
        .from("contact_group_members")
        .select("contact_id")
        .in("group_id", Array.from(selectedGroups));

      if (error) {
        console.error("Error fetching group members:", error);
        return [];
      }

      const contactIds = groupMembers.map((gm) => gm.contact_id);
      return contacts.filter(
        (c) => contactIds.includes(c.id) && c.status === "active"
      );
    }

    if (sendMode === "contacts") {
      return contacts.filter(
        (c) => selectedContacts.has(c.id) && c.status === "active"
      );
    }

    return [];
  };

  const updateRecipientCount = async () => {
    const recipients = await getRecipientList();
    setRecipientCount(recipients.length);
  };

  const handleSendCampaign = async () => {
  if (!selectedCampaign || !user) {
    toast.error("No campaign selected");
    return;
  }

  // Fetch recipients first
  const recipients = await getRecipientList();

  if (recipients.length === 0) {
    toast.error("No active recipients selected");
    return;
  }

  const campaignHtml = (selectedCampaign as any).custom_html || (selectedCampaign.content as any)?.html;

  if (!selectedCampaign.subject || !selectedCampaign.subject.trim()) {
    toast.error("Campaign subject is missing");
    return;
  }

  if (!campaignHtml || !campaignHtml.trim()) {
    toast.error("Campaign content is missing. Please edit the campaign and add HTML content.");
    return;
  }

  const confirmMessage = `Send "${selectedCampaign.name}" to ${recipients.length} recipient(s)?`;
  if (!confirm(confirmMessage)) return;

  setSending(selectedCampaign.id);
  setShowSendModal(false);
  const toastId = toast.loading(
    `Starting send to ${recipients.length} recipient(s)...`
  );

  try {
    // Kick off the server-side batch send. It runs in the Edge Function in the
    // BACKGROUND and returns immediately, so the whole list goes out (and survives
    // the tab closing) without the UI hanging on large lists.
    const { data: result, error: invokeError } = await supabase.functions.invoke('send-campaign', {
      body: { campaign_id: selectedCampaign.id },
    });

    if (invokeError || !result?.success) {
      const msg = result?.error || invokeError?.message || 'Failed to send campaign';
      console.error('send-campaign failed:', msg);
      toast.error(`Failed to send campaign: ${msg}`, { id: toastId });
    } else {
      toast.success('Campaign is sending! Large lists can take a few minutes.', { id: toastId });
    }

    fetchCampaigns();
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    toast.error(error.message || "Failed to send campaign", { id: toastId });
  } finally {
    setSending(null);
  }
};

  /**
   * Get status badge styling and icon
   */
  const getStatusBadge = (campaign: Campaign) => {
    if (campaign.status === "sent") {
      return {
        icon: <CheckCircle size={14} />,
        text: "Sent",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    }

    if (campaign.status === "scheduled") {
      return {
        icon: <Clock size={14} />,
        text: "Scheduled",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }

    if (campaign.status === "sending") {
      return {
        icon: <Play size={14} />,
        text: "Sending",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    }

    if (campaign.status === "cancelled") {
      return {
        icon: <XCircle size={14} />,
        text: "Cancelled",
        className: "bg-red-100 text-red-800 border-red-200",
      };
    }

    return {
      icon: <AlertCircle size={14} />,
      text: "Draft",
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  /**
   * Calculate open rate percentage
   */
  const getOpenRate = (campaign: Campaign) => {
    if (!campaign.recipients_count || campaign.recipients_count === 0) return 0;
    return Math.round((campaign.opens / campaign.recipients_count) * 100);
  };

  /**
   * Calculate click rate percentage
   */
  const getClickRate = (campaign: Campaign) => {
    if (!campaign.recipients_count || campaign.recipients_count === 0) return 0;
    return Math.round((campaign.clicks / campaign.recipients_count) * 100);
  };

  /**
   * Filter campaigns by search and status
   */
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout currentPath="/app/campaigns">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Campaigns</h1>
            <p className="text-gray-600">
              Create and manage your email campaigns.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setIsReturningFromTemplate(false);
              setModalKey(prev => prev + 1); 
              setShowCreateModal(true);
            }}
          >
            Create Campaign
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="input-base w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="cancelled">Cancelled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>

        {/* Campaign List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            <p className="text-gray-600 mt-4">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="card text-center py-12">
            <Mail size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No campaigns found</p>
            <p className="text-sm text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first campaign to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const statusBadge = getStatusBadge(campaign);
              const openRate = getOpenRate(campaign);
              const clickRate = getClickRate(campaign);

              return (
                <div
                  key={campaign.id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-serif font-bold">
                          {campaign.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.text}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{campaign.subject}</p>

                      {/* Metrics Row */}
                      <div className="flex gap-6 text-sm">
                        {campaign.status === "sent" ? (
                          <>
                            <div>
                              <span className="text-gray-600">Sent to: </span>
                              <span className="font-semibold">
                                {campaign.recipients_count || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Opens: </span>
                              <span className="font-semibold">
                                {campaign.opens || 0}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({openRate}%)
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Clicks: </span>
                              <span className="font-semibold">
                                {campaign.clicks || 0}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({clickRate}%)
                              </span>
                            </div>
                            {campaign.bounces > 0 && (
                              <div>
                                <span className="text-gray-600">Bounces: </span>
                                <span className="font-semibold text-red-600">
                                  {campaign.bounces}
                                </span>
                              </div>
                            )}
                          </>
                        ) : campaign.status === "cancelled" ? (
                          <div className="text-gray-500">
                            {campaign.emails_sent_before_cancel || 0} email{campaign.emails_sent_before_cancel === 1 ? '' : 's'} sent before cancellation
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">
                            Not yet sent
                          </div>
                        )}
                      </div>

                      {/* Sent Date */}
                      {campaign.sent_at && (
                        <div className="mt-3 text-xs text-gray-500">
                          Sent on {new Date(campaign.sent_at).toLocaleString()}
                        </div>
                      )}
                      
                      {/* Cancelled Date */}
                      {campaign.cancelled_at && (
                        <div className="mt-3 text-xs text-gray-500">
                          Cancelled on {new Date(campaign.cancelled_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600 mb-3">
                        Created{" "}
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>

                      {/* DRAFT STATUS - Edit, Delete, Send Buttons */}
                      {campaign.status === "draft" && (
                        <div className="flex flex-col gap-2">
                          <div className="text-sm text-gray-500 mb-1">
                            {(campaign as any).content?.recipients
                              ? `Recipients: ${campaign.recipients_count || 0}`
                              : 'No recipients selected'}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Edit2}
                              onClick={() => handleEdit(campaign)}
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeletingCampaign(campaign)}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Send}
                            onClick={() => handleQuickSend(campaign)}
                            loading={sending === campaign.id}
                            disabled={sending !== null}
                            className="w-full"
                          >
                            Send Campaign
                          </Button>
                        </div>
                      )}

                      {/* SCHEDULED STATUS - Edit, Delete, Send Now Buttons */}
                      {campaign.status === "scheduled" && (
                        <div className="flex flex-col gap-2">
                          {/* Scheduled Time Display */}
                          <div className="text-sm text-purple font-medium mb-1">
                            {(campaign as any).scheduled_at && (
                              <>📅 {new Date((campaign as any).scheduled_at).toLocaleString()}</>
                            )}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Edit2}
                              onClick={() => handleEdit(campaign)}
                              className="flex-1 border-purple text-purple hover:bg-purple/10"
                            >
                              Edit
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeletingCampaign(campaign)}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>

                            <Button
                              variant="primary"
                              size="md"
                              onClick={() => handleSendNow(campaign)}
                              loading={sendingNow === campaign.id}
                              disabled={sendingNow === campaign.id}
                              className="flex-[1.5]"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Send size={18} />
                                <span className="whitespace-nowrap">Send Now</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* SENDING STATUS - In Progress with Cancel Button */}
                      {campaign.status === "sending" && (
                        <div className="flex flex-col gap-2 items-end">
                          <div className="text-sm text-yellow-600 font-medium flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            Sending in progress...
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Please wait while emails are being sent
                          </div>
                          {/* NEW: Cancel button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={XCircle}
                            onClick={() => handleCancelCampaign(campaign)}
                            loading={cancelling === campaign.id}
                            disabled={cancelling !== null}
                            className="border-red-500 text-red-600 hover:bg-red-50 w-full"
                          >
                            {cancelling === campaign.id ? 'Cancelling...' : 'Cancel Send'}
                          </Button>
                        </div>
                      )}

                      {/* CANCELLED STATUS - Show Details */}
                      {campaign.status === "cancelled" && (
                        <div className="flex flex-col gap-2 items-end">
                          <div className="text-sm text-red-600 font-medium flex items-center gap-2">
                            <XCircle size={16} />
                            Cancelled
                          </div>
                          {campaign.emails_sent_before_cancel !== undefined && (
                            <div className="text-xs text-gray-600 mb-2">
                              {campaign.emails_sent_before_cancel} {campaign.emails_sent_before_cancel === 1 ? 'email' : 'emails'} sent before cancellation
                            </div>
                          )}
                          <div className="flex gap-2 w-full">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Eye}
                              onClick={() => {
                                setDetailsCampaign(campaign);
                                setShowDetailsModal(true);
                              }}
                              className="flex-1"
                            >
                              View Details
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Trash2}
                              onClick={() => setDeletingCampaign(campaign)}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* SENT STATUS - View Details */}
                      {campaign.status === "sent" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setDetailsCampaign(campaign);
                            setShowDetailsModal(true);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showCreateModal && (
          <CreateCampaignModal
            key={modalKey}
            shouldLoadTemplate={isReturningFromTemplate}
            preselectedTemplate={preselectedTemplate}
            onClose={() => {
              setIsReturningFromTemplate(false);
              setPreselectedTemplate(null);
              setModalKey(prev => prev + 1);
              setShowCreateModal(false);
            }}
            onSuccess={(campaign) => {
              window.history.replaceState({}, document.title);
              setIsReturningFromTemplate(false);
              setPreselectedTemplate(null);
              setModalKey(prev => prev + 1);
              setShowCreateModal(false);
              fetchCampaigns();
              toast.success("Campaign created successfully!");
            }}
          />
        )}
        {/* ✅ NEW: CreateCampaignModal in EDIT MODE for draft campaigns */}
        {editingDraftCampaign && (
          <CreateCampaignModal
            key={`edit-${editingDraftCampaign.id}`}
            editingCampaign={editingDraftCampaign}
            onClose={() => {
              setEditingDraftCampaign(null);
            }}
            onSuccess={(campaign) => {
              setEditingDraftCampaign(null);
              fetchCampaigns();
              toast.success("Campaign updated successfully!");
            }}
          />
        )}
        {/* Send Campaign Modal */}
        {showSendModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="border-b border-black p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold">
                    Send Campaign: {selectedCampaign.name}
                  </h2>
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="text-gray-500 hover:text-black text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Send Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Send To
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sendMode"
                        value="all"
                        checked={sendMode === "all"}
                        onChange={() => setSendMode("all")}
                        className="w-4 h-4"
                      />
                      <span>All Active Contacts ({contacts.length})</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sendMode"
                        value="groups"
                        checked={sendMode === "groups"}
                        onChange={() => setSendMode("groups")}
                        className="w-4 h-4"
                      />
                      <span>Specific Groups</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sendMode"
                        value="contacts"
                        checked={sendMode === "contacts"}
                        onChange={() => setSendMode("contacts")}
                        className="w-4 h-4"
                      />
                      <span>Specific Contacts</span>
                    </label>
                  </div>
                </div>

                {/* Group Selection */}
                {sendMode === "groups" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Select Groups
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.has(group.id)}
                            onChange={() => handleToggleGroup(group.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm text-gray-500">
                              {group.contact_count} contacts
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Selection */}
                {sendMode === "contacts" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">
                        Select Contacts
                      </label>
                      <button
                        onClick={handleSelectAllContacts}
                        className="text-sm text-purple hover:text-purple/80"
                      >
                        {selectedContacts.size === contacts.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {contacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => handleToggleContact(contact.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {contact.first_name || contact.last_name
                                ? `${contact.first_name || ""} ${
                                    contact.last_name || ""
                                  }`.trim()
                                : "No Name"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipient Count Summary */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Users size={20} />
                    <span className="font-semibold">
                      {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} will receive this
                      campaign
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendCampaign}
                  disabled={recipientCount === 0}
                  icon={Send}
                >
                  Send Campaign
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Campaign Details Modal */}
        {showDetailsModal && detailsCampaign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="border-b-2 border-black p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold">Campaign Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Campaign Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{detailsCampaign.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <p className="text-gray-900">{detailsCampaign.subject}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        detailsCampaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                        detailsCampaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        detailsCampaign.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {detailsCampaign.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                      <p className="text-gray-900">{detailsCampaign.recipients_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Email Metrics */}
                {detailsCampaign.status === 'sent' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-900">{detailsCampaign.opens || 0}</div>
                        <div className="text-sm text-blue-700">Opens</div>
                      </div>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-900">{detailsCampaign.clicks || 0}</div>
                        <div className="text-sm text-green-700">Clicks</div>
                      </div>
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-900">{detailsCampaign.bounces || 0}</div>
                        <div className="text-sm text-red-700">Bounces</div>
                      </div>
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-900">
                          {detailsCampaign.opens && detailsCampaign.recipients_count
                            ? Math.round((detailsCampaign.opens / detailsCampaign.recipients_count) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm text-purple-700">Open Rate</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Preview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Email Preview</h3>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setDetailsPreviewMobile(false)}
                        title="Desktop view"
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          !detailsPreviewMobile ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        <Monitor size={15} /> Desktop
                      </button>
                      <button
                        onClick={() => setDetailsPreviewMobile(true)}
                        title="Mobile view"
                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          detailsPreviewMobile ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        <Smartphone size={15} /> Mobile
                      </button>
                    </div>
                  </div>
                  <div className="border-2 border-black rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto flex justify-center">
                    {(detailsCampaign as any).custom_html || detailsCampaign.content?.html ? (
                      <div
                        className="transition-all duration-300 w-full"
                        style={{ maxWidth: detailsPreviewMobile ? '375px' : '100%' }}
                      >
                        <iframe
                          srcDoc={injectResponsiveStyles(
                            (detailsCampaign as any).custom_html || detailsCampaign.content?.html || ''
                          )}
                          className="w-full min-h-[400px] border-0 bg-white"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No email content available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-black p-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Edit Campaign Modal */}
        {editingCampaign && (
          <EditCampaignModal
            campaign={editingCampaign}
            onClose={() => setEditingCampaign(null)}
            onSuccess={() => {
              setEditingCampaign(null);
              fetchCampaigns();
            }}
          />
        )}

        {/* Delete Confirm Modal */}
        {deletingCampaign && (
          <DeleteConfirmModal
            campaign={deletingCampaign}
            onClose={() => setDeletingCampaign(null)}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        )}
    </AppLayout>
  );
}