import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useCenterStore from "../../src/stores/centerStore";
import useVoterStore from "../../src/stores/voterStore";
import VoterCard from "../../src/components/VoterCard";
import VoterDetailModal from "../../src/components/VoterDetailModal";
import {
  LoadingScreen,
  EmptyState,
  StatCard,
} from "../../src/components/Common";
import { centerAPI, exportAPI } from "../../src/api";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function CenterDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchCenter, selectedCenter } = useCenterStore();
  const {
    voters,
    fetchVoters,
    isLoading,
    pagination,
    getVoterDetails,
    selectedVoter,
    setSelectedVoter,
    deleteVoter,
  } = useVoterStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [profileClicks, setProfileClicks] = useState(0);
  const [canDeleteCenter, setCanDeleteCenter] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    await Promise.all([
      fetchCenter(id),
      fetchVoters(id, { page: 1, limit: 50 }),
      loadStats(),
    ]);
  };

  const loadStats = async () => {
    try {
      const response = await centerAPI.getStats(id);
      setStats(response.data.data);
    } catch (e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [id]);

  const handleVoterPress = async (voter) => {
    const details = await getVoterDetails(voter._id);
    if (details) {
      setShowDetailModal(true);
    }
  };

  const handleDeleteVoter = (voter) => {
    Alert.alert("ভোটার মুছুন", `"${voter.name}" মুছে ফেলতে চান?`, [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: async () => {
          const result = await deleteVoter(voter._id);
          if (result.success) {
            await loadStats();
          }
        },
      },
    ]);
  };

  const handleExportPdf = async (voterId) => {
    try {
      const response = await exportAPI.voterPdf(voterId);
      const fileUri = FileSystem.documentDirectory + `voter-${voterId}.pdf`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        ),
        { encoding: FileSystem.EncodingType.Base64 },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert("ব্যর্থ", "PDF ডাউনলোড করা যায়নি");
    }
  };

  const handleExportCenterPdf = async () => {
    try {
      Alert.alert("PDF তৈরি হচ্ছে...", "অনুগ্রহ করে অপেক্ষা করুন");
      const response = await exportAPI.centerPdf(id);
      const fileUri = FileSystem.documentDirectory + `center-${id}.pdf`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        btoa(
          new Uint8Array(response.data).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        ),
        { encoding: FileSystem.EncodingType.Base64 },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      Alert.alert("ব্যর্থ", "PDF তৈরি করা যায়নি");
    }
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.pages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVoters(id, { page: nextPage, limit: 50 });
    }
  };

  const handleCenterHeaderClick = () => {
    const newCount = profileClicks + 1;
    setProfileClicks(newCount);

    if (newCount === 5) {
      setCanDeleteCenter(!canDeleteCenter);
      setProfileClicks(0);
      Alert.alert(
        "ডিলিট অপশন",
        canDeleteCenter
          ? "ডিলিট অপশন ডিজেবল করা হয়েছে"
          : "ডিলিট অপশন এনেবল করা হয়েছে",
      );
    }
  };

  const handleDeleteCenter = () => {
    Alert.alert(
      "কেন্দ্র মুছুন",
      `"${selectedCenter.centerName}" মুছে ফেলতে চান?`,
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "মুছুন",
          style: "destructive",
          onPress: async () => {
            try {
              await centerAPI.delete(id);
              router.back();
            } catch (error) {
              Alert.alert("ব্যর্থ", "কেন্দ্র মুছতে পারা যায়নি");
            }
          },
        },
      ],
    );
  };

  if (!selectedCenter && isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-50">
      {/* Header */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-dark-100">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 bg-dark-100 w-9 h-9 rounded-xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCenterHeaderClick}
            className="flex-1"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-bold text-dark-800" numberOfLines={1}>
              {selectedCenter?.centerName || "কেন্দ্র"}
            </Text>
            <Text className="text-dark-400 text-xs">
              {selectedCenter?.division} › {selectedCenter?.zilla} ›{" "}
              {selectedCenter?.upazila}
            </Text>
            {canDeleteCenter && (
              <Text className="text-red-500 text-xs mt-1 font-semibold">
                ডিলিট অপশন সক্রিয়
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportCenterPdf}
            className="bg-emerald-50 w-9 h-9 rounded-xl items-center justify-center mr-2"
          >
            <Ionicons name="download-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/center/edit/${id}`)}
            className="bg-emerald-50 w-9 h-9 rounded-xl items-center justify-center mr-2"
          >
            <Ionicons name="create-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          {canDeleteCenter && (
            <TouchableOpacity
              onPress={handleDeleteCenter}
              className="bg-red-50 w-9 h-9 rounded-xl items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {stats && (
          <View className="flex-row gap-2">
            <StatCard
              icon="people"
              title="মোট"
              value={stats.totalVoters?.toString() || "0"}
              color="emerald"
            />
            <StatCard
              icon="man"
              title="পুরুষ"
              value={stats.maleVoters?.toString() || "0"}
              color="emerald"
            />
            <StatCard
              icon="woman"
              title="মহিলা"
              value={stats.femaleVoters?.toString() || "0"}
              color="purple"
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row px-4 py-3 gap-2 bg-white border-b border-dark-100">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/voter/create",
              params: { centerId: id },
            })
          }
          className="flex-1 bg-blue-500 rounded-xl py-2.5 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color="white" />
          <Text className="text-white font-semibold ml-2 text-sm">
            ভোটার যোগ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/import/pdf",
              params: { centerId: id },
            })
          }
          className="flex-1 bg-accent-500 rounded-xl py-2.5 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload" size={18} color="white" />
          <Text className="text-white font-semibold ml-2 text-sm">
            PDF ইম্পোর্ট
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voter List */}
      <FlatList
        data={voters}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <VoterCard voter={item} onPress={handleVoterPress} index={index} />
        )}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="কোনো ভোটার নেই"
            subtitle="ভোটার যোগ করুন বা PDF ইম্পোর্ট করুন"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      {/* Voter Detail Modal */}
      <VoterDetailModal
        visible={showDetailModal}
        voter={selectedVoter}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVoter(null);
        }}
        onExportPdf={handleExportPdf}
        onDeleteVoter={handleDeleteVoter}
      />
    </SafeAreaView>
  );
}
