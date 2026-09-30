import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCases,
  getDistricts,
  getDistrictForecast,
  getVerification,
  getTrust,
  getAudit,
  injectFault,
  resetDemo
} from './lib/api';
import { AppShell } from './components/layout/AppShell';
import { NavPage } from './components/layout/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { DistrictForecastPage } from './pages/DistrictForecastPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { VerificationPage } from './pages/VerificationPage';
import { TrustPage } from './pages/TrustPage';
import { AuditPage } from './pages/AuditPage';

export function App() {
  const queryClient = useQueryClient();

  // Navigation & selection states
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_lps_001'); // Hero case default
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('mh_nashik');
  const [thresholdMm, setThresholdMm] = useState<number>(64.5);

  // 1. Fetch Cases
  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases
  });

  // 2. Fetch Districts for selected case
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedCaseId],
    queryFn: () => getDistricts(selectedCaseId)
  });

  // 3. Fetch Focused Forecast Packet
  const { data: forecastPacket, isLoading: isForecastLoading } = useQuery({
    queryKey: ['forecast', selectedDistrictId, selectedCaseId],
    queryFn: () => getDistrictForecast(selectedDistrictId, selectedCaseId)
  });

  // 4. Fetch Verification Data for selected case & threshold
  const { data: verificationData } = useQuery({
    queryKey: ['verification', selectedCaseId, thresholdMm],
    queryFn: () => getVerification(selectedCaseId, thresholdMm)
  });

  // 5. Fetch Trust & Health
  const forecastId = forecastPacket?.forecast_id || `fc_${selectedCaseId}_${selectedDistrictId}`;
  const { data: trustData } = useQuery({
    queryKey: ['trust', forecastId],
    queryFn: () => getTrust(forecastId),
    enabled: !!forecastId
  });

  // 6. Fetch Audit Lineage
  const { data: auditData } = useQuery({
    queryKey: ['audit', forecastId],
    queryFn: () => getAudit(forecastId),
    enabled: !!forecastId
  });

  // Mutations for live fault injection & reset
  const faultMutation = useMutation({
    mutationFn: (fault: string) => injectFault(fault),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      queryClient.invalidateQueries({ queryKey: ['trust'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => resetDemo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      queryClient.invalidateQueries({ queryKey: ['trust'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    }
  });

  const currentCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <AppShell
      currentPage={currentPage}
      onSelectPage={setCurrentPage}
      currentCase={currentCase}
      fallbackState={forecastPacket?.fallback_state}
      activeFault={trustData?.active_fault}
      humanReviewRequired={forecastPacket?.human_review_required}
    >
      {currentPage === 'overview' && (
        <OverviewPage
          cases={cases}
          districts={districts}
          selectedCaseId={selectedCaseId}
          selectedDistrictId={selectedDistrictId}
          forecastPacket={forecastPacket}
          onSelectCase={setSelectedCaseId}
          onSelectDistrict={setSelectedDistrictId}
          onNavigateToForecast={() => setCurrentPage('forecast')}
        />
      )}

      {currentPage === 'forecast' && (
        <DistrictForecastPage
          packet={forecastPacket}
          cases={cases}
          districts={districts}
          selectedCaseId={selectedCaseId}
          selectedDistrictId={selectedDistrictId}
          onSelectCase={setSelectedCaseId}
          onSelectDistrict={setSelectedDistrictId}
          onNavigateToAudit={() => setCurrentPage('audit')}
        />
      )}

      {currentPage === 'explainability' && (
        <ExplainabilityPage packet={forecastPacket} />
      )}

      {currentPage === 'verification' && (
        <VerificationPage
          verificationData={verificationData}
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          thresholdMm={thresholdMm}
          onChangeThreshold={setThresholdMm}
        />
      )}

      {currentPage === 'trust' && (
        <TrustPage
          trustData={trustData}
          onInjectFault={async (f) => {
            await faultMutation.mutateAsync(f);
          }}
          onResetDemo={async () => {
            await resetMutation.mutateAsync();
          }}
          isMutating={faultMutation.isPending || resetMutation.isPending}
        />
      )}

      {currentPage === 'audit' && (
        <AuditPage auditData={auditData} />
      )}
    </AppShell>
  );
}

export default App;
