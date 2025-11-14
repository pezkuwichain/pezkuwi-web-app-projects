import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

const TeamSection: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "Satoshi Qazi Muhammed",
      role: "Chief Architect",
      description: "Blockchain visionary and protocol designer",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358016604_9ae228b4.webp"
    },
    {
      name: "Abdurrahman Qasimlo",
      role: "Governance Lead",
      description: "Democratic systems and consensus mechanisms",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358018357_f19e128d.webp"
    },
    {
      name: "Abdusselam Barzani",
      role: "Protocol Engineer",
      description: "Core protocol development and optimization",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358020150_1ea35457.webp"
    },
    {
      name: "Ihsan Nuri",
      role: "Security Advisor",
      description: "Cryptography and network security expert",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358021872_362f1214.webp"
    },
    {
      name: "Seyh Said",
      role: "Community Director",
      description: "Ecosystem growth and community relations",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358023648_4bb8f4c7.webp"
    },
    {
      name: "Seyyid Riza",
      role: "Treasury Manager",
      description: "Economic models and treasury operations",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358025533_d9df77a9.webp"
    },
    {
      name: "Beritan",
      role: "Developer Relations",
      description: "Technical documentation and developer support",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358027281_9254657a.webp"
    },
    {
      name: "Mashuk Xaznevi",
      role: "Research Lead",
      description: "Blockchain research and innovation",
      image: "https://d64gsuwffb70l.cloudfront.net/68ec477a0a2fa844d6f9df15_1760358029000_3ffc04bc.webp"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-kurdish-green/20 text-kurdish-green border-kurdish-green/30">
            <Users className="w-4 h-4 mr-2" />
            Our Team
          </Badge>
          <h2 className="text-4xl font-bold text-white mb-4">
            Meet the Visionaries
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A dedicated team of blockchain experts and governance specialists building the future of decentralized democracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 hover:border-kurdish-green/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-kurdish-green via-kurdish-red to-kurdish-yellow p-1 mb-4">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-kurdish-green transition-colors">
                    {member.name}
                  </h3>
                  <Badge className="mb-3 bg-kurdish-red/20 text-kurdish-red border-kurdish-red/30">
                    {member.role}
                  </Badge>
                  <p className="text-gray-400 text-sm">
                    {member.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;