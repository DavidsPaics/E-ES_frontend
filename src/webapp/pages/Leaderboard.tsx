// src/pages/Leaderboard.tsx

import React, { useEffect, useState } from "react";
import { Table, Alert, Avatar, Button, Typography } from "antd";
import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import type { SortOrder } from "antd/es/table/interface";
import type { TableProps } from "antd";
import PositionChangeIndicator from "@/webapp/components/PositionChangeIndicator";
import { ENDPOINT_LEADERBOARD, ENDPOINT_COMPETITORS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { fakeLeaderboardByAgeGroup, fakeCompetitors } from "@/webapp/data/fakeData";
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

// (1) Define the shape of what /api/leaderboard/:agegroup returns
type ApiRecord = {
  ID: number;
  username: string;
  avatar: string;
  "Category names": string[];
  "Category points": number[];
  position_change?: number;
};

// (2) Internal shape for each row in the Ant D Table
type LeaderboardEntry = {
  ID: number;
  avatar?: string;
  username: string;
  position_change: number;
  // plus one key per category name, each holding a number
  [category: string]: number | string | undefined;
};

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  // (A) Keep track of every age group we discovered (excluding “all”)
  const [ageGroups, setAgeGroups] = useState<string[] | null>(null);

  // (B) A lookup table: { [ageGroup: string]: LeaderboardEntry[] }
  const [allData, setAllData] = useState<Record<string, LeaderboardEntry[]>>({});

  // (C) loading + error states
  const [, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // (D) “fullscreen” toggle (applies to whichever table the user clicked on)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // ---------------------------------------------------------------------------------------------------------
  // STEP 1: Fetch /api/cars → extract distinct ageGroup values → store them in state
  // ---------------------------------------------------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    apiFetch(ENDPOINT_COMPETITORS)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<
          Array<{
            id: number;
            username: string;
            avatar: string;
            U: number;
            I: number;
            m: number;
            ageGroup: string;
          }>
        >;
      })
      .then((cars) => {
        // Extract unique ageGroup strings
        const groups = Array.from(new Set(cars.map((c) => c.ageGroup)));
        setAgeGroups(groups);
      })
      .catch(() => {
        // Use fake data on error
        console.log("Using fake data for leaderboard");
        const fakeGroups = Array.from(new Set(fakeCompetitors.map((c) => c.ageGroup)));
        setAgeGroups(fakeGroups);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------------------------------------------------------
  // STEP 2: Whenever ageGroups changes (i.e. once we have ["A","B","C"]), fire off N parallel fetches:
  //         1 for “all” + 1 for each actual group
  // ---------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!ageGroups) return;

    setLoading(true);
    setError(null);

    // Build an array of “ageGroup” strings including “all”
    const groupsToFetch = ["all", ...ageGroups];

    // For each group, fetch /api/leaderboard/:agegroup
    const fetches = groupsToFetch.map((grp) =>
      apiFetch(`${ENDPOINT_LEADERBOARD}/${grp}`)
        .then((res) => {
          if (!res.ok) throw new Error(`API /leaderboard/${grp} failed (HTTP ${res.status})`);
          return res.json() as Promise<ApiRecord[]>;
        })
        .then((rawRecords) => {
          // Transform ApiRecord[] → LeaderboardEntry[]
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
        // Turn an array of { ageGroup, entries } into a single lookup object
        const lookup: Record<string, LeaderboardEntry[]> = {};
        results.forEach(({ ageGroup, entries }) => {
          lookup[ageGroup] = entries;
        });
        setAllData(lookup);
      })
      .catch(() => {
        // Use fake data on error
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
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ageGroups]);

  // ---------------------------------------------------------------------------------------------------------
  // If we’re loading initially or if any error occurred, show spinner / alert
  // ---------------------------------------------------------------------------------------------------------
  if (error) {
    return <Alert type="error" message="Error" description={error} />;
  }

  // ---------------------------------------------------------------------------------------------------------
  // Utility: Given a non‐empty list of LeaderboardEntry, compute “categories” (i.e. all keys except ID/username/avatar/position_change)
  // ---------------------------------------------------------------------------------------------------------
  const computeCategories = (entries: LeaderboardEntry[]): string[] => {
    if (!entries.length) return [];
    return Object.keys(entries[0]).filter(
      (k) => !["ID", "username", "avatar", "position_change"].includes(k)
    );
  };

  // ---------------------------------------------------------------------------------------------------------
  // Utility: Given categories[], produce AntD column defs (just like before)
  // ---------------------------------------------------------------------------------------------------------
  const makeColumns = (categories: string[]): TableProps<LeaderboardEntry>["columns"] => {
    const baseCols: TableProps<LeaderboardEntry>["columns"] = [
      {
        title: "ID",
        dataIndex: "ID",
        key: "ID",
        sorter: (a, b) => a.ID - b.ID,
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
        sorter: (a, b) => String(a.username).localeCompare(String(b.username)),
        render: (text, record) => (
          <div className="flex items-center space-x-2">
            <span>{text}</span>
            <PositionChangeIndicator position_change={record.position_change} />
          </div>
        ),
      },
      // one column per category
      ...categories.map((cat) => ({
        title: cat,
        dataIndex: cat,
        key: cat,
        sorter: (a: any, b: any) => Number(a[cat] || 0) - Number(b[cat] || 0),
      })),
      {
        title: "Total Points",
        key: "total",
        defaultSortOrder: "descend" as SortOrder,
        sorter: (a, b) =>
          categories.reduce((sum, key) => sum + Number(a[key] || 0), 0) -
          categories.reduce((sum, key) => sum + Number(b[key] || 0), 0),
        render: (_: any, rec: any) =>
          categories.reduce((sum, key) => sum + Number(rec[key] || 0), 0),
      },
    ];

    return baseCols;
  };

  // ---------------------------------------------------------------------------------------------------------
  // If “expandedGroup” is non‐null, show just that one table in fullscreen mode.
  // ---------------------------------------------------------------------------------------------------------
  if (expandedGroup) {
    const entries = allData[expandedGroup] || [];
    const categories = computeCategories(entries);
    const columns = makeColumns(categories);

    return (
      <div className="fixed inset-0 z-50 bg-[#0A306D] overflow-auto sm:mt-0 mt-16">
        <div className="flex justify-end mb-2 p-4">
          <Button
            icon={<FullscreenExitOutlined />}
            onClick={() => setExpandedGroup(null)}
            style={{ background: "transparent", border: "none", color: "white" }}
          />
        </div>
        <Title level={3} style={{ textAlign: "center", marginBottom: 16, color: "white" }}>
          🏆 Leaderboard – Age Group “{expandedGroup}”
        </Title>
        <div className="px-6 pb-12">
          <Table<LeaderboardEntry>
            dataSource={entries}
            columns={columns}
            rowKey="ID"
            pagination={false}
            size="middle"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------------------------------------
  // Otherwise: render one section per ageGroup (including “all”)
  // ---------------------------------------------------------------------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t('leaderboard.header')}</h1>

      <div className="space-y-12">
          {["all", ...(ageGroups || [])].map((grp) => {
            const entries = allData[grp] || [];
            const categories = computeCategories(entries);
            const columns = makeColumns(categories);

            return (
              <div
                key={grp}
                className="bg-[#36598B]/30 backdrop-blur-md p-6 rounded-xl shadow-lg relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <Title level={4} style={{ margin: 0, color: "white" }}>
                    Age Group: “{grp}”
                  </Title>
                  <Button
                    size="small"
                    icon={<FullscreenOutlined />}
                    onClick={() => setExpandedGroup(grp)}
                    style={{ background: "transparent", border: "none" }}
                  />
                </div>

                <Table<LeaderboardEntry>
                  dataSource={entries}
                  columns={columns}
                  rowKey="ID"
                  pagination={false}
                  size="middle"
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Leaderboard;
