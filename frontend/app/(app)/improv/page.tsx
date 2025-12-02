"use client";

import React, { useState } from "react";
import { App } from '@/components/app/app';
import { APP_CONFIG_DEFAULTS, type AppConfig } from '@/app-config';

export default function ImprovPage() {
  const [name, setName] = useState("");
  const appConfig: AppConfig = {
    ...APP_CONFIG_DEFAULTS,
    pageTitle: 'Improv Battle',
    pageDescription: 'A live voice-first improv game hosted by an AI',
    startButtonText: 'Start Improv Battle',
    agentName: 'ImprovHost',
    // pass the contestant name to the connection-details endpoint
    playerName: name || undefined,
    supportsChatInput: false,
    supportsVideoInput: false,
    supportsScreenShare: false,
    isPreConnectBufferEnabled: true,
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-md p-6 rounded-lg bg-white shadow">
        <h1 className="text-2xl font-bold mb-4">Improv Battle</h1>
        <p className="mb-4">Join the show: put your name and click Start Improv Battle to connect.</p>
        <label className="block text-sm font-medium mb-1">Contestant name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border rounded p-2 mb-4"
        />
        <App appConfig={appConfig} />
        <p className="mt-4 text-xs text-gray-500">The host will introduce the show and run 3 quick rounds. Say 'End scene' to stop each round.</p>
      </div>
    </div>
  );
}
