import { cn } from "@/lib/utils";
import {
  Video,
  Calendar,
  CreditCard,
  Shield,
  Globe,
  MessageSquare,
  Star,
  Clock,
} from "lucide-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "HD Video Lessons",
      description: "Crystal-clear video calls with screen sharing, whiteboard, and recording capabilities.",
      icon: <Video className="w-6 h-6" />,
    },
    {
      title: "Smart Scheduling",
      description: "Book lessons in seconds with our intelligent calendar that syncs with your timezone.",
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      title: "Secure Payments",
      description: "Pay safely with Stripe. Automatic invoicing and transparent pricing.",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      title: "Verified Tutors",
      description: "Every tutor goes through rigorous verification and background checks.",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "Global Access",
      description: "Learn from tutors worldwide. 50+ languages available, 24/7 availability.",
      icon: <Globe className="w-6 h-6" />,
    },
    {
      title: "Direct Messaging",
      description: "Chat with tutors before booking. Discuss goals and expectations.",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "Review System",
      description: "Transparent ratings and reviews help you find the perfect tutor.",
      icon: <Star className="w-6 h-6" />,
    },
    {
      title: "Flexible Lessons",
      description: "1-on-1 or group sessions. From 30 minutes to 2+ hours. Your choice.",
      icon: <Clock className="w-6 h-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-200 dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-zinc-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
