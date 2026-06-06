import { useState } from "react";
import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

type Lang = "en" | "bn";

const content: Record<Lang, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 15, 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect information you provide directly, such as your name, email address, phone number, resume, and other profile details when you create an account or apply for jobs. We also automatically collect usage data including your IP address, browser type, device information, and pages visited.",
      },
      {
        heading: "2. How We Use Your Information",
        body: "We use your information to provide and improve the Platform's services, match job seekers with relevant opportunities, process job applications, communicate with you about your account and applications, send notifications about new jobs or updates, and ensure the security and integrity of our Platform.",
      },
      {
        heading: "3. Information Sharing",
        body: "We share your application details (including resume and cover letter) with employers when you apply for a job. We do not sell your personal information to third parties. We may share anonymized, aggregated data for analytics purposes. We may disclose information when required by law or to protect our rights.",
      },
      {
        heading: "4. Data Storage & Security",
        body: "Your data is stored on secure servers with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction. However, no method of transmission over the Internet is 100% secure.",
      },
      {
        heading: "5. Cookies & Tracking",
        body: "We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze Platform usage. You can control cookie settings through your browser. Disabling cookies may limit some features of the Platform.",
      },
      {
        heading: "6. Your Rights",
        body: "You have the right to access, update, or delete your personal information at any time through your account settings. You may request a copy of the data we hold about you. You can opt out of promotional communications by following the unsubscribe link in our emails or updating your notification preferences.",
      },
      {
        heading: "7. Data Retention",
        body: "We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes, such as resolving disputes and enforcing our agreements.",
      },
      {
        heading: "8. Children's Privacy",
        body: "The Platform is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 16, we will take steps to delete such information promptly.",
      },
      {
        heading: "9. Changes to This Policy",
        body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Platform or sending you an email. Your continued use of the Platform after changes constitutes your acceptance of the updated policy.",
      },
      {
        heading: "10. Contact Us",
        body: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@joblagbe.com.",
      },
    ],
  },
  bn: {
    title: "গোপনীয়তা নীতি",
    lastUpdated: "সর্বশেষ আপডেট: ১৫ মার্চ, ২০২৬",
    sections: [
      {
        heading: "১. আমরা যে তথ্য সংগ্রহ করি",
        body: "আপনি যখন অ্যাকাউন্ট তৈরি করেন বা চাকরিতে আবেদন করেন তখন আপনার নাম, ইমেইল ঠিকানা, ফোন নম্বর, জীবনবৃত্তান্ত এবং অন্যান্য প্রোফাইল তথ্য সরাসরি সংগ্রহ করি। এছাড়াও আমরা স্বয়ংক্রিয়ভাবে আপনার আইপি ঠিকানা, ব্রাউজারের ধরন, ডিভাইসের তথ্য এবং পরিদর্শিত পৃষ্ঠাগুলো সহ ব্যবহারের তথ্য সংগ্রহ করি।",
      },
      {
        heading: "২. আমরা কীভাবে আপনার তথ্য ব্যবহার করি",
        body: "আমরা প্ল্যাটফর্মের সেবা প্রদান ও উন্নত করতে, চাকরি প্রার্থীদের প্রাসঙ্গিক সুযোগের সাথে মেলাতে, চাকরির আবেদন প্রক্রিয়া করতে, আপনার অ্যাকাউন্ট ও আবেদন সম্পর্কে যোগাযোগ করতে, নতুন চাকরি বা আপডেট সম্পর্কে বিজ্ঞপ্তি পাঠাতে এবং আমাদের প্ল্যাটফর্মের নিরাপত্তা নিশ্চিত করতে আপনার তথ্য ব্যবহার করি।",
      },
      {
        heading: "৩. তথ্য শেয়ারিং",
        body: "আপনি যখন চাকরিতে আবেদন করেন তখন আমরা আপনার আবেদনের বিবরণ (জীবনবৃত্তান্ত ও কভার লেটার সহ) নিয়োগকর্তাদের সাথে শেয়ার করি। আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না। বিশ্লেষণের উদ্দেশ্যে আমরা বেনামী, সমষ্টিগত তথ্য শেয়ার করতে পারি। আইনের প্রয়োজনে বা আমাদের অধিকার রক্ষায় তথ্য প্রকাশ করতে পারি।",
      },
      {
        heading: "৪. তথ্য সংরক্ষণ ও নিরাপত্তা",
        body: "আপনার তথ্য শিল্প-মানের এনক্রিপশন সহ নিরাপদ সার্ভারে সংরক্ষিত হয়। আমরা অননুমোদিত অ্যাক্সেস, পরিবর্তন বা ধ্বংসের বিরুদ্ধে আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে যথাযথ প্রযুক্তিগত ও সাংগঠনিক ব্যবস্থা বাস্তবায়ন করি। তবে ইন্টারনেটে প্রেরণের কোনো পদ্ধতিই ১০০% নিরাপদ নয়।",
      },
      {
        heading: "৫. কুকিজ ও ট্র্যাকিং",
        body: "আমরা আপনার অভিজ্ঞতা উন্নত করতে, আপনার পছন্দ মনে রাখতে এবং প্ল্যাটফর্মের ব্যবহার বিশ্লেষণ করতে কুকিজ ও অনুরূপ প্রযুক্তি ব্যবহার করি। আপনি আপনার ব্রাউজারের মাধ্যমে কুকি সেটিংস নিয়ন্ত্রণ করতে পারেন। কুকিজ নিষ্ক্রিয় করলে প্ল্যাটফর্মের কিছু ফিচার সীমিত হতে পারে।",
      },
      {
        heading: "৬. আপনার অধিকার",
        body: "আপনার অ্যাকাউন্ট সেটিংসের মাধ্যমে যেকোনো সময় আপনার ব্যক্তিগত তথ্য অ্যাক্সেস, আপডেট বা মুছে ফেলার অধিকার আপনার রয়েছে। আমাদের কাছে সংরক্ষিত আপনার তথ্যের একটি কপি অনুরোধ করতে পারেন। আমাদের ইমেইলে আনসাবস্ক্রাইব লিঙ্ক অনুসরণ করে বা আপনার বিজ্ঞপ্তি পছন্দ আপডেট করে প্রচারমূলক যোগাযোগ থেকে অপ্ট আউট করতে পারেন।",
      },
      {
        heading: "৭. তথ্য ধারণ",
        body: "আপনার অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত বা সেবা প্রদানের জন্য প্রয়োজনীয় সময় পর্যন্ত আমরা আপনার ব্যক্তিগত তথ্য ধারণ করি। আইনের প্রয়োজনে বা বৈধ ব্যবসায়িক উদ্দেশ্যে, যেমন বিরোধ নিষ্পত্তি এবং আমাদের চুক্তি প্রয়োগের জন্য কিছু তথ্য ধারণ করতে পারি।",
      },
      {
        heading: "৮. শিশুদের গোপনীয়তা",
        body: "প্ল্যাটফর্মটি ১৬ বছরের কম বয়সী ব্যক্তিদের জন্য নয়। আমরা জেনেশুনে শিশুদের কাছ থেকে ব্যক্তিগত তথ্য সংগ্রহ করি না। যদি আমরা জানতে পারি যে ১৬ বছরের কম বয়সী কোনো শিশুর তথ্য সংগ্রহ করা হয়েছে, তাহলে আমরা দ্রুত সেই তথ্য মুছে ফেলার পদক্ষেপ নেব।",
      },
      {
        heading: "৯. এই নীতিতে পরিবর্তন",
        body: "আমরা সময়ে সময়ে এই গোপনীয়তা নীতি আপডেট করতে পারি। উল্লেখযোগ্য পরিবর্তনের ক্ষেত্রে আমরা প্ল্যাটফর্মে একটি নোটিশ পোস্ট করে বা আপনাকে ইমেইল পাঠিয়ে জানাব। পরিবর্তনের পর আপনার প্ল্যাটফর্ম ব্যবহার অব্যাহত রাখা আপডেট করা নীতি গ্রহণ হিসেবে বিবেচিত হবে।",
      },
      {
        heading: "১০. যোগাযোগ করুন",
        body: "এই গোপনীয়তা নীতি বা আমাদের তথ্য চর্চা সম্পর্কে আপনার কোনো প্রশ্ন বা উদ্বেগ থাকলে, অনুগ্রহ করে support@joblagbe.com-এ আমাদের সাথে যোগাযোগ করুন।",
      },
    ],
  },
};

const PrivacyPolicy = () => {
  const [lang, setLang] = useState<Lang>("bn");
  const t = content[lang];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="গোপনীয়তা নীতি"
        description="Job লাগবে-এর গোপনীয়তা নীতি। আমরা কীভাবে আপনার তথ্য সংগ্রহ ও ব্যবহার করি জানুন।"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "গোপনীয়তা নীতি",
          url: "https://www.joblagbe.bd/privacy-policy",
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

export default PrivacyPolicy;
