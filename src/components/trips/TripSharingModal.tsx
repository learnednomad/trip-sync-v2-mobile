/**
 * Trip Sharing Modal Component
 * Epic 2: Story 2.1 - Core Trip Management
 * Acceptance Criteria 5: Trip Sharing & Collaboration Prep
 */

import React, { useState } from 'react';
import { View, Modal, ScrollView, Share, Alert } from 'react-native';
import { 
  X, Share as ShareIcon, Copy, Mail, Users, 
  Link, QrCode, Settings, Lock 
} from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Trip, ParticipantRole } from '@/api/trips/types';

interface TripSharingModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
  onInviteParticipants: (emails: string[], role: ParticipantRole, message?: string) => void;
  onUpdateSharingSettings: (settings: SharingSettings) => void;
}

interface SharingSettings {
  visibility: 'public' | 'participants' | 'private';
  allowJoinRequests: boolean;
  requireApproval: boolean;
  shareableLink: boolean;
}

const roleOptions = [
  { label: 'Viewer', value: 'VIEWER' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Admin', value: 'ADMIN' },
];

const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Participants Only', value: 'participants' },
  { label: 'Public', value: 'public' },
];

export function TripSharingModal({ 
  visible, 
  onClose, 
  trip, 
  onInviteParticipants, 
  onUpdateSharingSettings 
}: TripSharingModalProps) {
  const [activeTab, setActiveTab] = useState<'invite' | 'link' | 'settings'>('invite');
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<ParticipantRole>('MEMBER');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>({
    visibility: trip.settings.visibility || 'private',
    allowJoinRequests: false,
    requireApproval: true,
    shareableLink: true,
  });

  const shareableLink = `https://tripsync.app/trips/${trip.id}/join`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareableLink)}`;

  const handleInviteSubmit = () => {
    if (!inviteEmails.trim()) {
      Alert.alert('Error', 'Please enter at least one email address');
      return;
    }

    const emails = inviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emails.length === 0) {
      Alert.alert('Error', 'Please enter valid email addresses');
      return;
    }

    onInviteParticipants(emails, inviteRole, inviteMessage || undefined);
    setInviteEmails('');
    setInviteMessage('');
    Alert.alert('Success', 'Invitations sent successfully!');
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: `Join my trip: ${trip.name}\n${shareableLink}`,
        url: shareableLink,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: `Join my trip: ${trip.name}`,
        message: `I'd like to invite you to join my trip "${trip.name}" to ${trip.destination}. Use this link to join: ${shareableLink}`,
        url: shareableLink,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share trip');
    }
  };

  const handleSaveSettings = () => {
    onUpdateSharingSettings(sharingSettings);
    Alert.alert('Success', 'Sharing settings updated!');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 py-6 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">Share Trip</Text>
              <Text className="text-gray-600 mt-1">{trip.name}</Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onPress={onClose}
              className="p-2"
            >
              <X width={24} height={24} color="#6B7280" />
            </Button>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mt-4 bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeTab === 'invite' ? 'default' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab('invite')}
              className="flex-1 flex-row items-center justify-center"
            >
              <Users width={16} height={16} color={activeTab === 'invite' ? 'white' : '#6B7280'} />
              <Text className={`ml-2 ${activeTab === 'invite' ? 'text-white' : 'text-gray-600'}`}>
                Invite
              </Text>
            </Button>
            
            <Button
              variant={activeTab === 'link' ? 'default' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab('link')}
              className="flex-1 flex-row items-center justify-center"
            >
              <Link width={16} height={16} color={activeTab === 'link' ? 'white' : '#6B7280'} />
              <Text className={`ml-2 ${activeTab === 'link' ? 'text-white' : 'text-gray-600'}`}>
                Link
              </Text>
            </Button>
            
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onPress={() => setActiveTab('settings')}
              className="flex-1 flex-row items-center justify-center"
            >
              <Settings width={16} height={16} color={activeTab === 'settings' ? 'white' : '#6B7280'} />
              <Text className={`ml-2 ${activeTab === 'settings' ? 'text-white' : 'text-gray-600'}`}>
                Settings
              </Text>
            </Button>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Invite Tab */}
          {activeTab === 'invite' && (
            <View className="space-y-6">
              <Text className="text-lg font-semibold text-gray-900">
                Invite People to Your Trip
              </Text>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Email Addresses</Text>
                <Input
                  placeholder="Enter email addresses separated by commas"
                  value={inviteEmails}
                  onChangeText={setInviteEmails}
                  multiline
                  className="min-h-[80px]"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Example: john@example.com, jane@example.com
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Role</Text>
                <Select
                  value={inviteRole}
                  onSelect={(value) => setInviteRole(value as ParticipantRole)}
                  options={roleOptions}
                  placeholder="Select role"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Members can view and edit, Viewers can only view
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</Text>
                <Input
                  placeholder="Add a personal message to the invitation..."
                  value={inviteMessage}
                  onChangeText={setInviteMessage}
                  multiline
                  className="min-h-[80px]"
                />
              </View>

              <Button
                onPress={handleInviteSubmit}
                className="bg-blue-600"
                disabled={!inviteEmails.trim()}
              >
                <Mail width={16} height={16} color="white" />
                <Text className="text-white font-medium ml-2">Send Invitations</Text>
              </Button>
            </View>
          )}

          {/* Link Tab */}
          {activeTab === 'link' && (
            <View className="space-y-6">
              <Text className="text-lg font-semibold text-gray-900">
                Share with Link
              </Text>

              <View className="bg-gray-50 p-4 rounded-lg">
                <Text className="text-sm font-medium text-gray-700 mb-2">Trip Link</Text>
                <View className="flex-row items-center bg-white p-3 rounded border border-gray-200">
                  <Text className="flex-1 text-gray-800 text-sm" numberOfLines={1}>
                    {shareableLink}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleCopyLink}
                    className="ml-2 p-1"
                  >
                    <Copy width={16} height={16} color="#6B7280" />
                  </Button>
                </View>
              </View>

              <View className="flex-row space-x-3">
                <Button
                  onPress={handleNativeShare}
                  className="flex-1 bg-green-600"
                >
                  <ShareIcon width={16} height={16} color="white" />
                  <Text className="text-white font-medium ml-2">Share Link</Text>
                </Button>
                
                <Button
                  variant="outline"
                  onPress={handleCopyLink}
                  className="flex-1"
                >
                  <Copy width={16} height={16} color="#6B7280" />
                  <Text className="text-gray-700 font-medium ml-2">Copy Link</Text>
                </Button>
              </View>

              {/* QR Code Section */}
              <View className="bg-gray-50 p-4 rounded-lg items-center">
                <Text className="text-sm font-medium text-gray-700 mb-3">QR Code</Text>
                <View className="bg-white p-4 rounded-lg border border-gray-200">
                  <QrCode width={120} height={120} color="#000000" />
                </View>
                <Text className="text-xs text-gray-500 mt-2 text-center">
                  Scan to join the trip
                </Text>
              </View>

              {sharingSettings.visibility === 'private' && (
                <View className="bg-yellow-50 p-3 rounded-lg flex-row items-start">
                  <Lock width={16} height={16} color="#D97706" />
                  <Text className="text-yellow-800 text-sm ml-2 flex-1">
                    Trip is set to private. Only invited participants can join.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <View className="space-y-6">
              <Text className="text-lg font-semibold text-gray-900">
                Sharing Settings
              </Text>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Trip Visibility</Text>
                <Select
                  value={sharingSettings.visibility}
                  onSelect={(value) => setSharingSettings(prev => ({ 
                    ...prev, 
                    visibility: value as any 
                  }))}
                  options={visibilityOptions}
                  placeholder="Select visibility"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Controls who can see your trip
                </Text>
              </View>

              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Allow Join Requests</Text>
                    <Text className="text-xs text-gray-500">
                      People can request to join your trip
                    </Text>
                  </View>
                  <Button
                    variant={sharingSettings.allowJoinRequests ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setSharingSettings(prev => ({ 
                      ...prev, 
                      allowJoinRequests: !prev.allowJoinRequests 
                    }))}
                    className="ml-3"
                  >
                    <Text className={sharingSettings.allowJoinRequests ? 'text-white' : 'text-gray-700'}>
                      {sharingSettings.allowJoinRequests ? 'On' : 'Off'}
                    </Text>
                  </Button>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Require Approval</Text>
                    <Text className="text-xs text-gray-500">
                      New participants need approval before joining
                    </Text>
                  </View>
                  <Button
                    variant={sharingSettings.requireApproval ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setSharingSettings(prev => ({ 
                      ...prev, 
                      requireApproval: !prev.requireApproval 
                    }))}
                    className="ml-3"
                  >
                    <Text className={sharingSettings.requireApproval ? 'text-white' : 'text-gray-700'}>
                      {sharingSettings.requireApproval ? 'On' : 'Off'}
                    </Text>
                  </Button>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Shareable Link</Text>
                    <Text className="text-xs text-gray-500">
                      Generate a link that others can use to join
                    </Text>
                  </View>
                  <Button
                    variant={sharingSettings.shareableLink ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setSharingSettings(prev => ({ 
                      ...prev, 
                      shareableLink: !prev.shareableLink 
                    }))}
                    className="ml-3"
                  >
                    <Text className={sharingSettings.shareableLink ? 'text-white' : 'text-gray-700'}>
                      {sharingSettings.shareableLink ? 'On' : 'Off'}
                    </Text>
                  </Button>
                </View>
              </View>

              <Button
                onPress={handleSaveSettings}
                className="bg-blue-600 mt-6"
              >
                <Settings width={16} height={16} color="white" />
                <Text className="text-white font-medium ml-2">Save Settings</Text>
              </Button>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}