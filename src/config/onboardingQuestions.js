/**
 * Onboarding profile questions — per vertical.
 * Each vertical has exactly 4 questions so the step indicator is always 1-2-3-4
 * (Step 1 = vertical pick, Step 2 = Q1+Q2, Step 3 = Q3+Q4, Step 4 = complete).
 */
export const ONBOARDING_QUESTIONS = {
  filmmaker: [
    {
      id: 'project_stage',
      question: 'What stage is your current project?',
      options: ['Development', 'Pre-production', 'Production', 'Post-production', 'Distribution', 'No active project'],
    },
    {
      id: 'content_type',
      question: 'What type of content do you make?',
      options: ['Feature Film', 'Short Film', 'Documentary', 'TV / Streaming', 'Commercial', 'Multiple formats'],
    },
    {
      id: 'budget_range',
      question: "What's your typical budget range?",
      options: ['Under $50K', '$50K – $500K', '$500K – $5M', '$5M+', "Still figuring it out"],
    },
    {
      id: 'seeking',
      question: "What are you primarily looking for?",
      options: ['Film financing', 'Co-producers', 'Distribution deals', 'Crew & talent', 'All of the above'],
    },
  ],

  musician: [
    {
      id: 'genre',
      question: 'What genre do you primarily work in?',
      options: ['Pop', 'R&B / Soul', 'Hip-Hop', 'Rock / Alternative', 'Electronic / EDM', 'Country', 'Classical / Jazz', 'Other'],
    },
    {
      id: 'release_status',
      question: "What's your current release status?",
      options: ['Unreleased / Still recording', 'Released singles', 'EP or album out', 'Actively touring'],
    },
    {
      id: 'monthly_listeners',
      question: 'Spotify monthly listeners?',
      options: ['Under 1K', '1K – 10K', '10K – 100K', '100K+', 'Not on Spotify yet'],
    },
    {
      id: 'goal',
      question: "What's your primary goal right now?",
      options: ['Sync licensing', 'Record deal', 'Brand partnerships', 'Grow my audience', 'Live performance / touring'],
    },
  ],

  composer: [
    {
      id: 'speciality',
      question: 'What do you specialise in scoring?',
      options: ['Drama', 'Horror / Thriller', 'Action / Adventure', 'Documentary', 'Comedy', 'Animation', 'Multiple genres'],
    },
    {
      id: 'credits',
      question: 'How many screen credits do you have?',
      options: ['None yet', '1 – 5 credits', '6 – 20 credits', '20+ credits'],
    },
    {
      id: 'daw',
      question: 'Primary DAW / tool?',
      options: ['Logic Pro', 'Pro Tools', 'Cubase / Nuendo', 'Ableton', 'Sibelius / Finale', 'Other'],
    },
    {
      id: 'seeking',
      question: "What are you actively seeking?",
      options: ['New scoring projects', 'Sync licensing deals', 'Agent / representation', 'Collaborators', 'All of the above'],
    },
  ],

  actor: [
    {
      id: 'experience',
      question: "What's your experience level?",
      options: ['Student / Beginner', 'Emerging (some credits)', 'Established (regular credits)', 'Name talent'],
    },
    {
      id: 'market',
      question: "What's your primary market?",
      options: ['Film', 'TV / Streaming', 'Theater', 'Commercial', 'All markets'],
    },
    {
      id: 'representation',
      question: 'Do you have representation?',
      options: ['No representation yet', 'Agent only', 'Agent + Manager', 'Full team (agent, manager, publicist)'],
    },
    {
      id: 'union',
      question: 'Union status?',
      options: ['SAG-AFTRA', 'Non-union', 'SAG-AFTRA eligible', 'AEA (theater)', 'Multiple'],
    },
  ],

  screenwriter: [
    {
      id: 'format',
      question: 'What format do you primarily write?',
      options: ['Feature films', 'TV pilots', 'Limited series', 'Short films', 'Multiple formats'],
    },
    {
      id: 'genre',
      question: 'What genre do you write?',
      options: ['Drama', 'Comedy', 'Horror / Thriller', 'Sci-Fi / Fantasy', 'Action / Adventure', 'Multiple genres'],
    },
    {
      id: 'career_status',
      question: "Where are you in your career?",
      options: ['Writing my first script', 'Have completed scripts, querying', 'Optioned or sold work', 'Represented by agent / manager'],
    },
    {
      id: 'seeking',
      question: "What are you looking for right now?",
      options: ['Script competitions & fellowships', 'Manager / agent', 'Production company connections', 'Writing partner', 'All of the above'],
    },
  ],

  crew: [
    {
      id: 'role',
      question: "What's your primary role?",
      options: ['Director of Photography', '1st AD / 2nd AD', 'Production Designer / Art Dept', 'Gaffer / Electric', 'Sound Mixer / Boom', 'Hair / MUA / Costume', 'Other'],
    },
    {
      id: 'experience',
      question: 'Years of industry experience?',
      options: ['0 – 2 years', '2 – 5 years', '5 – 10 years', '10+ years'],
    },
    {
      id: 'union',
      question: 'Union membership?',
      options: ['IATSE', 'Teamsters', 'Non-union', 'Multiple / Other'],
    },
    {
      id: 'availability',
      question: 'Current availability?',
      options: ['Available now', 'Available in 1 – 3 months', 'Fully booked', 'Part-time / local only'],
    },
  ],

  artist: [
    {
      id: 'medium',
      question: 'What medium do you work in?',
      options: ['Oil / Acrylic', 'Digital / NFT', 'Sculpture', 'Photography', 'Mixed Media', 'Multiple mediums'],
    },
    {
      id: 'market',
      question: 'What markets are you pursuing?',
      options: ['Gallery exhibitions', 'Public commissions', 'Licensing / prints', 'Online / direct sales', 'All markets'],
    },
    {
      id: 'gallery',
      question: 'Are you represented by a gallery?',
      options: ['Yes, currently represented', 'No, actively seeking', 'Not interested in galleries'],
    },
    {
      id: 'price_range',
      question: 'Typical price range per piece?',
      options: ['Under $500', '$500 – $2K', '$2K – $10K', '$10K+', 'Varies widely'],
    },
  ],

  writer: [
    {
      id: 'genre',
      question: 'What genre do you write?',
      options: ['Literary Fiction', 'Genre Fiction (sci-fi, fantasy, mystery…)', 'Non-Fiction', 'YA / Middle Grade', "Children's", 'Poetry / Other'],
    },
    {
      id: 'status',
      question: 'Where are you in the process?',
      options: ['Writing / drafting', 'Querying agents', 'Agented, on submission', 'Published'],
    },
    {
      id: 'publishing_path',
      question: 'Publishing path?',
      options: ['Traditional publishing', 'Self-publishing', 'Hybrid', 'Still deciding'],
    },
    {
      id: 'seeking',
      question: "What are you most focused on?",
      options: ['Finding an agent', 'Book deal / publisher', 'Growing my platform', 'ARC campaigns & reviews', 'All of the above'],
    },
  ],

  artsorg: [
    {
      id: 'org_type',
      question: 'What type of organization?',
      options: ['501(c)(3) Non-profit', 'For-profit arts business', 'Educational institution', 'Government arts body', 'Other'],
    },
    {
      id: 'budget',
      question: 'Annual operating budget?',
      options: ['Under $100K', '$100K – $500K', '$500K – $2M', '$2M+'],
    },
    {
      id: 'funding_source',
      question: 'Primary funding source?',
      options: ['Grants', 'Individual donors', 'Government / public funding', 'Earned income (tickets, tuition)', 'Mixed'],
    },
    {
      id: 'focus',
      question: "What's your primary program focus?",
      options: ['Artist residencies & support', 'Education & outreach', 'Exhibitions & performance', 'Grant-making', 'All of the above'],
    },
  ],
};
