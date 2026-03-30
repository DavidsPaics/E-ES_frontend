import React, { useEffect, useState } from "react";
import { Table, Spin, Alert, Avatar } from "antd";
import type { TableProps } from "antd";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_LEADERBOARD, ENDPOINT_COMPETITORS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeLeaderboardByAgeGroup, fakeCompetitors } from "@/webapp/data/fakeData";
import TVDisplay from "@/webapp/components/TVDisplay";

type ApiRecord = {
  ID: number;
  username: string;
  avatar: string;
  "Category names": string[];
  "Category points": number[];
  position_change?: number;
};

type LeaderboardEntry = {
  ID: number;
  avatar?: string;
  username: string;
  position_change: number;
  [category: string]: number | string | undefined;
};

const LeaderboardTV: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [ageGroups, setAgeGroups] = useState<string[] | null>(null);
  const [allData, setAllData] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tvMode, setTVMode] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
    }
  }, [isAuthenticated]);

  // Fetch age groups
  useEffect(() => {
    setLoading(true);
    apiFetch(ENDPOINT_COMPETITORS)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<
          Array<{
            id: string;
            username: string;
            avatar: string;
            ageGroup: string;
          }>
        >;
      })
      .then((cars) => {
        const groups = Array.from(new Set(cars.map((c) => c.ageGroup)));
        setAgeGroups(groups);
      })
      .catch(() => {
        const fakeGroups = Array.from(new Set(fakeCompetitors.map((c) => c.ageGroup)));
        setAgeGroups(fakeGroups);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch leaderboard data for all groups
  useEffect(() => {
    if (!ageGroups) return;

    setLoading(true);
    setError(null);

    const groupsToFetch = ["all", ...ageGroups];
    const fetches = groupsToFetch.map((grp) =>
      apiFetch(`${ENDPOINT_LEADERBOARD}/${grp}`)
        .then((res) => {
          if (!res.ok) throw new Error(`API failed`);
          return res.json() as Promise<ApiRecord[]>;
        })
        .then((rawRecords) => {
          const entries: LeaderboardEntry[] = rawRecords.map((rec) => {
            const base: any = {
              ID: rec.ID,
              avatar: rec.avatar,
              username: rec.username,
              position_change: rec.position_change ?? 0,
            };
            rec["Category names"].forEach((catName, idx) => {
              base[catName] = rec["Category points"][idx];
            });
            return base as LeaderboardEntry;
          });
          return { ageGroup: grp, entries };
        })
    );

    Promise.all(fetches)
      .then((results) => {
        const lookup: Record<string, LeaderboardEntry[]> = {};
        results.forEach(({ ageGroup, entries }) => {
          lookup[ageGroup] = entries;
        });
        setAllData(lookup);
      })
      .catch((err) => {
        console.log("Using fake leaderboard data");
        const fakeLookup: Record<string, LeaderboardEntry[]> = {};
        Object.entries(fakeLeaderboardByAgeGroup).forEach(([grp, records]) => {
          fakeLookup[grp] = records.map((rec) => {
            const base: any = {
              ID: rec.ID,
              avatar: rec.avatar,
              username: rec.username,
              position_change: rec.position_change ?? 0,
            };
            rec["Category names"].forEach((catName, idx) => {
              base[catName] = rec["Category points"][idx];
            });
            return base as LeaderboardEntry;
          });
        });
        setAllData(fakeLookup);
      })
      .finally(() => setLoading(false));
  }, [ageGroups]);

  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }

  if (loading) {
    return <Spin tip="Loading leaderboard…" style={{ margin: 50 }} />;
  }

  if (!ageGroups) {
    return <Alert type="error" message="No age groups found" />;
  }

  const computeCategories = (entries: LeaderboardEntry[]): string[] => {
    if (!entries.length) return [];
    return Object.keys(entries[0]).filter(
      (k) => !["ID", "username", "avatar", "position_change"].includes(k)
    );
  };

  const makeColumns = (categories: string[]) => {
    const baseCols: TableProps<LeaderboardEntry>["columns"] = [
      {
        title: "ID",
        dataIndex: "ID",
        key: "ID",
        width: 60,
      },
      {
        title: "",
        dataIndex: "avatar",
        key: "avatar",
        width: 60,
        render: (src: string) => <Avatar src={src} size="large" />,
      },
      {
        title: "Username",
        dataIndex: "username",
        key: "username",
      },
      ...categories.map((cat) => ({
        title: cat,
        dataIndex: cat,
        key: cat,
      })),
      {
        title: "Total Points",
        key: "total",
        render: (_: any, rec: any) =>
          categories.reduce((sum, key) => sum + Number(rec[key] || 0), 0),
      },
    ];
    return baseCols;
  };

  const renderTable = (group: string) => {
    const entries = allData[group] || [];
    const categories = computeCategories(entries);
    const columns = makeColumns(categories);

    return (
      <Table<LeaderboardEntry>
        dataSource={entries}
        columns={columns}
        rowKey="ID"
        pagination={false}
        size="large"
        style={{ fontSize: "14px" }}
      />
    );
  };

  const groups = ["all", ...ageGroups];

  return (
    <TVDisplay
      title="🏆 Leaderboard TV"
      groups={groups}
      renderTable={renderTable}
      onClose={() => window.history.back()}
    />
  );
};

export default LeaderboardTV;
