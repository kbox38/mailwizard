import { useState, useEffect } from 'react';
import { Search, Plus, Upload, Trash2, UserPlus } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AddContactModal } from '../../components/contacts/AddContactModal';
import { AddGroupModal } from '../../components/contacts/AddGroupModal';
import { ImportCSVModal } from '../../components/contacts/ImportCSVModal';
import { EditContactModal } from '../../components/contacts/EditContactModal';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  role: string | null;
  industry: string | null;
  status: string;
  created_at: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  contact_count: number;
  created_at: string;
}

export const Contacts = () => {
  const { user } = useAuth();
  
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchContactsInGroup(selectedGroupId);
    } else {
      fetchContacts();
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load contact groups');
    }
  };

  const fetchContacts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchContactsInGroup = async (groupId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_group_members')
        .select('contact_id, contacts(*)')
        .eq('group_id', groupId);
      
      if (error) throw error;
      
      const groupContacts = data?.map(item => item.contacts).filter(Boolean) as Contact[];
      setContacts(groupContacts || []);
    } catch (error) {
      console.error('Error fetching group contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
      
      toast.success('Contact deleted successfully');
      if (selectedGroupId) {
        fetchContactsInGroup(selectedGroupId);
      } else {
        fetchContacts();
      }
      fetchGroups(); // Refresh group counts
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} contact(s)?`)) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts));
      
      if (error) throw error;
      
      toast.success(`Deleted ${selectedContacts.size} contact(s)`);
      setSelectedContacts(new Set());
      if (selectedGroupId) {
        fetchContactsInGroup(selectedGroupId);
      } else {
        fetchContacts();
      }
      fetchGroups();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete contacts');
    }
  };

  // 🔥 NEW: Delete group function
  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return;
    
    const confirmMessage = group.contact_count > 0
      ? `Delete "${group.name}"? This will remove ${group.contact_count} contact(s) from this group. The contacts themselves will NOT be deleted.`
      : `Delete "${group.name}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');
      
      // If deleted group was selected, switch to All Contacts
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        fetchContacts();
      }
      
      fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleContactCheckbox = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.email.toLowerCase().includes(searchLower) ||
      contact.first_name?.toLowerCase().includes(searchLower) ||
      contact.last_name?.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower)
    );
  });

  const totalContactsCount = contacts.length;

  return (
    <AppLayout currentPath="/app/contacts">
      <div className="flex h-full">
        {/* Left Sidebar - Groups */}
        <div className="w-1/4 border-r border-gray-200 overflow-y-auto p-4">
          <div className="mb-4">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setShowAddGroupModal(true)}
            >
              New Group
            </Button>
          </div>

          <div className="space-y-2">
            {/* All Contacts */}
            <button
              onClick={() => setSelectedGroupId(null)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                selectedGroupId === null
                  ? 'bg-[#f3ba42] border-black font-semibold'
                  : 'bg-white border-gray-200 hover:border-black'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All Contacts</span>
                <span className={`text-sm ${
                  selectedGroupId === null ? 'text-black' : 'text-gray-500'
                }`}>
                  {totalContactsCount}
                </span>
              </div>
            </button>

            {/* Groups - 🔥 MODIFIED: Added delete button */}
            {groups.map((group) => (
              <div
                key={group.id}
                className={`w-full rounded-lg border transition-all duration-200 group relative ${
                  selectedGroupId === group.id
                    ? 'bg-[#f3ba42] border-black'
                    : 'bg-white border-gray-200 hover:border-black'
                }`}
              >
                <button
                  onClick={() => setSelectedGroupId(group.id)}
                  className="w-full text-left px-4 py-3 pr-12"
                >
                  <div className="flex items-center justify-between">
                    <span className={selectedGroupId === group.id ? 'font-semibold' : ''}>
                      {group.name}
                    </span>
                    <span className={`text-sm ${
                      selectedGroupId === group.id ? 'text-black' : 'text-gray-500'
                    }`}>
                      {group.contact_count}
                    </span>
                  </div>
                </button>
                
                {/* Delete button - shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  title="Delete group"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Contact List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-bold mb-2">
                {selectedGroupId 
                  ? groups.find(g => g.id === selectedGroupId)?.name || 'Contacts'
                  : 'All Contacts'
                }
              </h1>
              <p className="text-gray-600">
                {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                icon={Upload}
                onClick={() => setShowImportModal(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setShowAddContactModal(true)}
              >
                Add Contact
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedContacts.size > 0 && (
              <div className="mb-4 bg-[#f3ba42] border border-black rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="font-semibold">
                  {selectedContacts.size} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    icon={Trash2}
                    onClick={handleBulkDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Contact Table */}
            {loading ? (
              <div className="bg-white border border-black rounded-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3ba42] mb-4"></div>
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="bg-white border border-black rounded-lg p-12 text-center">
                {searchQuery ? (
                  <>
                    <Search size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-serif font-bold mb-2">No contacts found</h3>
                    <p className="text-gray-600 mb-6">
                      No contacts match your search "{searchQuery}"
                    </p>
                    <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
                  </>
                ) : selectedGroupId ? (
                  <>
                    <UserPlus size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-serif font-bold mb-2">No contacts in this group</h3>
                    <p className="text-gray-600 mb-6">
                      Start by adding contacts to this group
                    </p>
                    <Button onClick={() => setShowAddContactModal(true)}>
                      Add Contact
                    </Button>
                  </>
                ) : (
                  <>
                    <UserPlus size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-serif font-bold mb-2">No contacts yet</h3>
                    <p className="text-gray-600 mb-6">
                      Get started by adding your first contact or importing from CSV
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setShowAddContactModal(true)}>
                        Add Contact
                      </Button>
                      <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                        Import CSV
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* 🔥 MODIFIED: Added horizontal scroll wrapper */
              <div className="bg-white border border-black rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-black"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Industry</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedContacts.has(contact.id)}
                              onChange={() => handleContactCheckbox(contact.id)}
                              className="w-4 h-4 rounded border-black"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {contact.first_name || contact.last_name
                              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{contact.email}</td>
                          <td className="px-4 py-3 text-gray-600">{contact.company || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{contact.role || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{contact.industry || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              contact.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : contact.status === 'bounced'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingContactId(contact.id)}
                                className="text-[#57377d] hover:text-[#f3ba42] font-medium text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals - ALL NOW HAVE isOpen PROP */}
      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onSuccess={() => {
          fetchContacts();
          fetchGroups();
        }}
        groups={groups}
      />

      <AddGroupModal
        isOpen={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        onSuccess={() => {
          fetchGroups();
        }}
      />

      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchContacts();
          fetchGroups();
        }}
        groups={groups}
      />

      <EditContactModal
        isOpen={!!editingContactId}
        contactId={editingContactId}
        onClose={() => setEditingContactId(null)}
        onSuccess={() => {
          if (selectedGroupId) {
            fetchContactsInGroup(selectedGroupId);
          } else {
            fetchContacts();
          }
          fetchGroups();
        }}
        groups={groups}
      />
    </AppLayout>
  );
};