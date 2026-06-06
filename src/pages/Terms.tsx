import { useState } from "react";
import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

type Lang = "en" | "bn";

const content: Record<Lang, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: "Terms & Conditions",
    lastUpdated: "Last updated: March 15, 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By accessing and using Job Lagbe (the \"Platform\"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform. These terms apply to all visitors, users, job seekers, and employers who access or use the Platform.",
      },
      {
        heading: "2. Account Registration",
        body: "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use of your account.",
      },
      {
        heading: "3. User Responsibilities",
        body: "Users agree not to post false, misleading, or fraudulent job listings or applications. You must not use the Platform for any unlawful purpose or in violation of any applicable law. Users shall not attempt to gain unauthorized access to the Platform or its systems. Any content you submit must not infringe on any third-party rights.",
      },
      {
        heading: "4. Job Listings & Applications",
        body: "Employers are responsible for the accuracy and legality of their job postings. Job Lagbe does not guarantee employment outcomes for job seekers. We reserve the right to remove any job listing that violates our policies. Applications submitted through the Platform are shared directly with the respective employer.",
      },
      {
        heading: "5. Intellectual Property",
        body: "All content, features, and functionality of the Platform are owned by Job Lagbe and are protected by copyright, trademark, and other intellectual property laws. Users may not reproduce, distribute, or create derivative works from Platform content without prior written consent.",
      },
      {
        heading: "6. Privacy & Data Protection",
        body: "Your use of the Platform is also governed by our Privacy Policy. We collect, store, and process personal data in accordance with applicable data protection laws of Bangladesh. By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.",
      },
      {
        heading: "7. Limitation of Liability",
        body: "Job Lagbe is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform. We do not guarantee the accuracy, completeness, or reliability of any content posted by users. The Platform is provided on an \"as is\" and \"as available\" basis without warranties of any kind.",
      },
      {
        heading: "8. Termination",
        body: "We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Upon termination, your right to use the Platform will immediately cease. All provisions that should survive termination shall remain in effect.",
      },
      {
        heading: "9. Modifications",
        body: "Job Lagbe reserves the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting on the Platform. Your continued use of the Platform after any changes constitutes your acceptance of the new terms.",
      },
      {
        heading: "10. Contact Information",
        body: "If you have any questions about these Terms & Conditions, please contact us at support@joblagbe.com.",
      },
    ],
  },
  bn: {
    title: "শর্তাবলী",
    lastUpdated: "সর্বশেষ আপডেট: ১৫ মার্চ, ২০২৬",
    sections: [
      {
        heading: "১. শর্তাবলী গ্রহণ",
        body: "Job Lagbe (\"প্ল্যাটফর্ম\") ব্যবহার করার মাধ্যমে আপনি এই শর্তাবলী মেনে নিতে সম্মত হচ্ছেন। আপনি যদি এই শর্তাবলীতে সম্মত না হন, তাহলে অনুগ্রহ করে প্ল্যাটফর্মটি ব্যবহার করবেন না। এই শর্তাবলী সকল দর্শক, ব্যবহারকারী, চাকরি প্রার্থী এবং নিয়োগকর্তাদের জন্য প্রযোজ্য।",
      },
      {
        heading: "২. অ্যাকাউন্ট নিবন্ধন",
        body: "নির্দিষ্ট ফিচার ব্যবহার করতে আপনাকে একটি অ্যাকাউন্ট তৈরি করতে হবে। নিবন্ধনের সময় আপনি সঠিক, বর্তমান এবং সম্পূর্ণ তথ্য প্রদান করতে সম্মত হচ্ছেন। আপনার অ্যাকাউন্টের গোপনীয়তা রক্ষা এবং আপনার অ্যাকাউন্টের অধীনে সকল কার্যকলাপের জন্য আপনি দায়ী। অননুমোদিত ব্যবহারের ক্ষেত্রে অবিলম্বে আমাদের জানাতে হবে।",
      },
      {
        heading: "৩. ব্যবহারকারীর দায়িত্ব",
        body: "ব্যবহারকারীরা মিথ্যা, বিভ্রান্তিকর বা প্রতারণামূলক চাকরির তালিকা বা আবেদন পোস্ট না করতে সম্মত হচ্ছেন। কোনো বেআইনি উদ্দেশ্যে বা প্রযোজ্য আইন লঙ্ঘন করে প্ল্যাটফর্ম ব্যবহার করা যাবে না। ব্যবহারকারীরা প্ল্যাটফর্ম বা এর সিস্টেমে অননুমোদিত অ্যাক্সেস নেওয়ার চেষ্টা করবেন না। আপনার জমা দেওয়া কোনো বিষয়বস্তু তৃতীয় পক্ষের অধিকার লঙ্ঘন করবে না।",
      },
      {
        heading: "৪. চাকরির তালিকা ও আবেদন",
        body: "নিয়োগকর্তারা তাদের চাকরির পোস্টের সঠিকতা এবং বৈধতার জন্য দায়ী। Job Lagbe চাকরি প্রার্থীদের জন্য চাকরি পাওয়ার নিশ্চয়তা দেয় না। আমাদের নীতি লঙ্ঘনকারী যেকোনো চাকরির তালিকা অপসারণের অধিকার আমরা সংরক্ষণ করি। প্ল্যাটফর্মের মাধ্যমে জমা দেওয়া আবেদনগুলো সরাসরি সংশ্লিষ্ট নিয়োগকর্তার সাথে শেয়ার করা হয়।",
      },
      {
        heading: "৫. মেধা সম্পদ",
        body: "প্ল্যাটফর্মের সকল বিষয়বস্তু, ফিচার এবং কার্যকারিতা Job Lagbe-এর মালিকানাধীন এবং কপিরাইট, ট্রেডমার্ক এবং অন্যান্য মেধা সম্পদ আইন দ্বারা সুরক্ষিত। পূর্ব লিখিত অনুমতি ছাড়া ব্যবহারকারীরা প্ল্যাটফর্মের বিষয়বস্তু পুনরুৎপাদন, বিতরণ বা ডেরিভেটিভ কাজ তৈরি করতে পারবেন না।",
      },
      {
        heading: "৬. গোপনীয়তা ও তথ্য সুরক্ষা",
        body: "আপনার প্ল্যাটফর্ম ব্যবহার আমাদের গোপনীয়তা নীতি দ্বারাও পরিচালিত। আমরা বাংলাদেশের প্রযোজ্য তথ্য সুরক্ষা আইন অনুযায়ী ব্যক্তিগত তথ্য সংগ্রহ, সংরক্ষণ এবং প্রক্রিয়াকরণ করি। প্ল্যাটফর্ম ব্যবহার করে আপনি আমাদের গোপনীয়তা নীতিতে বর্ণিত আপনার তথ্য সংগ্রহ ও ব্যবহারে সম্মতি দিচ্ছেন।",
      },
      {
        heading: "৭. দায় সীমাবদ্ধতা",
        body: "Job Lagbe আপনার প্ল্যাটফর্ম ব্যবহার থেকে উদ্ভূত কোনো প্রত্যক্ষ, পরোক্ষ, আকস্মিক বা পরিণামগত ক্ষতির জন্য দায়ী নয়। ব্যবহারকারীদের পোস্ট করা কোনো বিষয়বস্তুর সঠিকতা, সম্পূর্ণতা বা নির্ভরযোগ্যতার নিশ্চয়তা আমরা দিই না। প্ল্যাটফর্মটি কোনো ধরনের ওয়ারেন্টি ছাড়াই \"যেমন আছে\" এবং \"যেমন পাওয়া যায়\" ভিত্তিতে প্রদান করা হয়।",
      },
      {
        heading: "৮. সমাপ্তি",
        body: "আমরা যেকোনো সময়, কারণ সহ বা ছাড়া, নোটিশ সহ বা ছাড়া আপনার অ্যাকাউন্ট স্থগিত বা বন্ধ করার অধিকার সংরক্ষণ করি। সমাপ্তির পর প্ল্যাটফর্ম ব্যবহারের আপনার অধিকার অবিলম্বে বন্ধ হয়ে যাবে। সমাপ্তির পরেও যে সকল বিধান বলবৎ থাকা উচিত সেগুলো কার্যকর থাকবে।",
      },
      {
        heading: "৯. পরিবর্তন",
        body: "Job Lagbe যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার সংরক্ষণ করে। পরিবর্তনগুলো প্ল্যাটফর্মে পোস্ট করার সাথে সাথে কার্যকর হবে। কোনো পরিবর্তনের পর আপনার প্ল্যাটফর্ম ব্যবহার অব্যাহত রাখা নতুন শর্তাবলী গ্রহণ হিসেবে বিবেচিত হবে।",
      },
      {
        heading: "১০. যোগাযোগের তথ্য",
        body: "এই শর্তাবলী সম্পর্কে আপনার কোনো প্রশ্ন থাকলে, অনুগ্রহ করে support@joblagbe.com-এ আমাদের সাথে যোগাযোগ করুন।",
      },
    ],
  },
};

const Terms = () => {
  const [lang, setLang] = useState<Lang>("bn");
  const t = content[lang];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="শর্তাবলী"
        description="Job লাগবে ওয়েবসাইটের ব্যবহারের শর্তাবলী পড়ুন।"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "শর্তাবলী",
          url: "https://www.joblagbe.bd/terms",
          inLanguage: "bn",
          isPartOf: { "@type": "WebSite", name: "Job লাগবে", url: "https://www.joblagbe.bd" },
        }}
      />
      <Header />
      <main className="container max-w-3xl py-10 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.lastUpdated}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-start"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
          >
            <Globe className="h-4 w-4" />
            {lang === "en" ? "বাংলা" : "English"}
          </Button>
        </div>

        <div className="space-y-8">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-2 text-lg font-semibold">{section.heading}</h2>
              <p className="leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
