import React, { useState } from 'react';
import { Server, Globe, TestTube, Code, Wifi, Copy, Check } from 'lucide-react';

interface ChainSpec {
  id: string;
  name: string;
  type: 'Live' | 'Development' | 'Local';
  icon: React.ReactNode;
  endpoint: string;
  chainId: string;
  validators: number;
  features: string[];
  color: string;
}

const chainSpecs: ChainSpec[] = [
  {
    id: 'mainnet',
    name: 'PezkuwiChain Mainnet',
    type: 'Live',
    icon: <Globe className="w-5 h-5" />,
    endpoint: 'wss://mainnet.pezkuwichain.io',
    chainId: '0x1234...abcd',
    validators: 100,
    features: ['Production', 'Real Tokenomics', 'Full Security'],
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'staging',
    name: 'PezkuwiChain Staging',
    type: 'Live',
    icon: <Server className="w-5 h-5" />,
    endpoint: 'wss://staging.pezkuwichain.io',
    chainId: '0x5678...efgh',
    validators: 20,
    features: ['Pre-production', 'Testing Features', 'Beta Access'],
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'testnet',
    name: 'Real Testnet',
    type: 'Live',
    icon: <TestTube className="w-5 h-5" />,
    endpoint: 'wss://testnet.pezkuwichain.io',
    chainId: '0x9abc...ijkl',
    validators: 8,
    features: ['Test Tokens', 'Full Features', 'Public Testing'],
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'beta',
    name: 'Beta Testnet',
    type: 'Live',
    icon: <TestTube className="w-5 h-5" />,
    endpoint: 'wss://beta.pezkuwichain.io',
    chainId: '0xdef0...mnop',
    validators: 4,
    features: ['Experimental', 'New Features', 'Limited Access'],
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'development',
    name: 'Development',
    type: 'Development',
    icon: <Code className="w-5 h-5" />,
    endpoint: 'ws://127.0.0.1:9944',
    chainId: '0xlocal...dev',
    validators: 1,
    features: ['Single Node', 'Fast Block Time', 'Dev Tools'],
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'local',
    name: 'Local Testnet',
    type: 'Local',
    icon: <Wifi className="w-5 h-5" />,
    endpoint: 'ws://127.0.0.1:9945',
    chainId: '0xlocal...test',
    validators: 2,
    features: ['Multi-node', 'Local Testing', 'Custom Config'],
    color: 'from-indigo-500 to-indigo-600'
  }
];

const ChainSpecs: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<ChainSpec>(chainSpecs[0]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="py-20 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Chain Specifications
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Multiple network environments for development, testing, and production
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {chainSpecs.map((spec) => (
            <div
              key={spec.id}
              onClick={() => setSelectedSpec(spec)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                selectedSpec.id === spec.id
                  ? 'bg-gray-900 border-purple-500'
                  : 'bg-gray-950/50 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${spec.color} bg-opacity-20`}>
                  {spec.icon}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  spec.type === 'Live' ? 'bg-green-900/30 text-green-400' :
                  spec.type === 'Development' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {spec.type}
                </span>
              </div>
              
              <h3 className="text-white font-semibold mb-2">{spec.name}</h3>
              
              <div className="flex items-center text-sm text-gray-400">
                <Server className="w-3 h-3 mr-1" />
                <span>{spec.validators} validators</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Chain Details */}
        <div className="bg-gray-950/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedSpec.color} bg-opacity-20 mr-3`}>
                  {selectedSpec.icon}
                </div>
                {selectedSpec.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">WebSocket Endpoint</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 p-3 bg-gray-900 rounded-lg text-cyan-400 font-mono text-sm">
                      {selectedSpec.endpoint}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedSpec.endpoint, `endpoint-${selectedSpec.id}`)}
                      className="ml-2 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedId === `endpoint-${selectedSpec.id}` ? 
                        <Check className="w-5 h-5 text-green-400" /> : 
                        <Copy className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Chain ID</label>
                  <div className="flex items-center mt-1">
                    <code className="flex-1 p-3 bg-gray-900 rounded-lg text-purple-400 font-mono text-sm">
                      {selectedSpec.chainId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedSpec.chainId, `chainid-${selectedSpec.id}`)}
                      className="ml-2 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedId === `chainid-${selectedSpec.id}` ? 
                        <Check className="w-5 h-5 text-green-400" /> : 
                        <Copy className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Features</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpec.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-gray-900 text-gray-300 text-sm rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Connection Example</h4>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-400 mb-2">// Using @polkadot/api</div>
                <div className="text-cyan-400">import</div>
                <div className="text-white ml-2">{'{ ApiPromise, WsProvider }'}</div>
                <div className="text-cyan-400">from</div>
                <div className="text-green-400 mb-3">'@polkadot/api';</div>
                
                <div className="text-cyan-400">const</div>
                <div className="text-white ml-2">provider =</div>
                <div className="text-cyan-400 ml-2">new</div>
                <div className="text-yellow-400 ml-2">WsProvider(</div>
                <div className="text-green-400 ml-4">'{selectedSpec.endpoint}'</div>
                <div className="text-yellow-400">);</div>
                
                <div className="text-cyan-400 mt-2">const</div>
                <div className="text-white ml-2">api =</div>
                <div className="text-cyan-400 ml-2">await</div>
                <div className="text-yellow-400 ml-2">ApiPromise.create</div>
                <div className="text-white">({'{ provider }'});</div>
              </div>

              <div className="mt-4 p-4 bg-kurdish-green/20 rounded-lg border border-kurdish-green/30">
                <h5 className="text-kurdish-green font-semibold mb-2">Network Stats</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Block Time:</span>
                    <span className="text-white ml-2">6s</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Finality:</span>
                    <span className="text-white ml-2">GRANDPA</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Consensus:</span>
                    <span className="text-white ml-2">Aura</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Runtime:</span>
                    <span className="text-white ml-2">v1.0.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChainSpecs;