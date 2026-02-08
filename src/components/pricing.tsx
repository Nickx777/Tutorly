"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Star } from "lucide-react";
import Link from "next/link";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  customPriceText?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  accent?: "violet" | "emerald";
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you",
}: PricingProps) {
  return (
    <div className="container py-12 relative">
      {/* Subtle dotted grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.08) 0.8px, transparent 0.8px)',
          backgroundSize: '14px 14px',
          maskImage:
            'radial-gradient( circle at 50% 10%, rgba(0,0,0,1), rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 70% )',
        }}
      />

      {/* Radial spotlight */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full z-0',
          'bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]',
          'blur-[30px]',
        )}
      />

      <div className="relative z-10 text-center space-y-4 mb-8">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-slate-400 text-lg whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <PricingCard.Card key={index} className={cn(
            "max-w-none",
            plan.accent === "violet" && "border-violet-500/50 shadow-violet-500/20",
            plan.accent === "emerald" && "border-emerald-500/50 shadow-emerald-500/20"
          )}>
            <PricingCard.Header>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  {plan.accent === "violet" ? <Star className="text-violet-400 fill-violet-400" /> : <Users className="text-emerald-400" />}
                  <span className="text-muted-foreground">{plan.name}</span>
                </PricingCard.PlanName>
                {plan.isPopular && <PricingCard.Badge className="bg-violet-500/20 text-violet-300 border-violet-500/50">Most Popular</PricingCard.Badge>}
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>
                  {plan.customPriceText ?? (plan.price.includes("%") ? plan.price : `$${plan.price}`)}
                </PricingCard.MainPrice>
                <PricingCard.Period>{plan.period}</PricingCard.Period>
              </PricingCard.Price>
              <PricingCard.Description className="mb-4">{plan.description}</PricingCard.Description>
              <Button
                asChild
                className={cn(
                  'w-full font-semibold',
                  plan.accent === "violet"
                    ? 'text-white bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_10px_25px_rgba(124,58,237,0.3)] hover:from-violet-600 hover:to-violet-700'
                    : 'text-white bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:from-emerald-600 hover:to-emerald-700'
                )}
              >
                <Link href={plan.href}>
                  {plan.buttonText}
                </Link>
              </Button>
            </PricingCard.Header>
            <PricingCard.Body>
              <PricingCard.List>
                {plan.features.map((item, i) => (
                  <PricingCard.ListItem key={i}>
                    <span className="mt-0.5">
                      <CheckCircle2
                        className="h-4 w-4 text-green-500"
                        aria-hidden="true"
                      />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        ))}
      </div>
    </div>
  );
}
