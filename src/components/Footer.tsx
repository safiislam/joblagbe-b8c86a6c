import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Job Lagbe" className="h-10 w-auto" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Bangladesh's trusted job portal connecting talent with opportunity since 2024.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Job Seekers</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Browse Jobs</a></li>
              <li><a href="#" className="hover:text-primary">Companies</a></li>
              <li><a href="#" className="hover:text-primary">Career Advice</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Employers</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Post a Job</a></li>
              <li><a href="#" className="hover:text-primary">Pricing</a></li>
              <li><a href="#" className="hover:text-primary">Employer Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">About Us</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © 2024 Job Lagbe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
