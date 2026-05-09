"use client";

import * as React from "react";
import { listCases } from "@/lib/api";
import { mockCases } from "@/lib/mock-data";
import type { CaseRecord } from "@/lib/types";
import { getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";
import { Select } from "@/components/ui/select";

type CaseSelectorProps = {
  value: string;
  onChange: (caseId: string) => void;
};

export function CaseSelector({ value, onChange }: CaseSelectorProps) {
  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const onChangeRef = React.useRef(onChange);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  React.useEffect(() => {
    let mounted = true;
    listCases()
      .then((data) => {
        if (!mounted) return;
        setCases(data.length ? data : mockCases);
        const stored = getCurrentCaseId();
        const next = valueRef.current || stored || data[0]?.case_id || mockCases[0].case_id;
        if (next) onChangeRef.current(next);
      })
      .catch(() => {
        if (!mounted) return;
        setCases(mockCases);
        const next = valueRef.current || getCurrentCaseId() || mockCases[0].case_id;
        onChangeRef.current(next);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function handleChange(caseId: string) {
    setCurrentCaseId(caseId);
    onChange(caseId);
  }

  return (
    <Select value={value} onChange={(event) => handleChange(event.target.value)}>
      {cases.map((item) => (
        <option key={item.case_id} value={item.case_id}>
          {item.case_id} - {item.victim_name}
        </option>
      ))}
    </Select>
  );
}
