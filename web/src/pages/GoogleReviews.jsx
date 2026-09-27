import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const reviews = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    avatar: 'RK',
    rating: 5,
    date: '2 weeks ago',
    text: 'Excellent service! Ordered my father\'s diabetes medicines at 8 PM and they were delivered by 10 AM next morning. The pharmacist even called to confirm the dosage. Very professional and caring team. Highly recommend for elderly care.',
    verified: true,
    tags: ['Fast Delivery', 'Elderly Care', 'Professional']
  },
  {
    id: 2,
    name: 'Priya Menon',
    avatar: 'PM',
    rating: 5,
    date: '1 month ago',
    text: 'Been using their lab test service for 6 months now. Home sample collection is so convenient - the phlebotomist arrives on time, is very gentle, and reports come on WhatsApp within 24 hours. Prices are reasonable compared to big hospitals. My go-to for all blood tests.',
    verified: true,
    tags: ['Lab Tests', 'Home Collection', 'Good Value']
  },
  {
    id: 3,
    name: 'Suresh Nair',
    avatar: 'SN',
    rating: 5,
    date: '3 weeks ago',
    text: 'Joined the Gold membership last month and already saved ₹2,400 on my family\'s medicines. Free delivery on every order is a game changer - no more minimum order worry. The auto-refill reminders ensure my mom never misses her BP meds. Best healthcare decision this year!',
    verified: true,
    tags: ['Gold Member', 'Savings', 'Auto Refill']
  },
  {
    id: 4,
    name: 'Lakshmi Amma',
    avatar: 'LA',
    rating: 5,
    date: '2 months ago',
    text: 'Very good pharmacy. Staff speaks Malayalam and explains medicines properly. My husband\'s prescription for heart medicine - they checked for interactions with his other tablets and warned us about timing. Such care is rare these days. God bless the team.',
    verified: true,
    tags: ['Local Language', 'Safety Check', 'Caring Staff']
  },
  {
    id: 5,
    name: 'Arjun Varma',
    avatar: 'AV',
    rating: 4,
    date: '1 week ago',
    text: 'Good service overall. Ordered antibiotics for throat infection - delivered in 3 hours! Only reason for 4 stars: the delivery person didn\'t have change for ₹500, had to pay via UPI. Otherwise medicines are genuine, prices fair, and they follow up to check if you\'re better.',
    verified: true,
    tags: ['Fast Delivery', 'Genuine Medicines', 'Follow Up']
  },
  {
    id: 6,
    name: 'Dr. Meera Iyer',
    avatar: 'MI',
    rating: 5,
    date: '3 weeks ago',
    text: 'As a doctor, I\'m particular about pharmacy standards. Dhiya\'s Pharmousy maintains proper cold chain for insulin and vaccines - I\'ve verified this myself. They stock quality generics and branded medicines. Their pharmacist knowledge is impressive. I confidently recommend them to my patients.',
    verified: true,
    tags: ['Doctor Recommended', 'Cold Chain', 'Quality Medicines']
  },
  {
    id: 7,
    name: 'Kavya Suresh',
    avatar: 'KS',
    rating: 5,
    date: '1 month ago',
    text: 'Pregnancy vitamins and supplements - they guided me on which brands are safe and checked my prescription thoroughly. Free delivery was a blessing during my third trimester when I couldn\'t walk much. The pharmacist even suggested iron-rich foods. Felt like family care, not just business.',
    verified: true,
    tags: ['Pregnancy Care', 'Free Delivery', 'Nutrition Advice']
  },
  {
    id: 8,
    name: 'Mohammed Ali',
    avatar: 'MA',
    rating: 4,
    date: '2 weeks ago',
    text: 'Good pharmacy with honest pricing. My mother\'s thyroid medicines are ₹15 cheaper here than other stores. They don\'t push expensive brands unnecessarily. Only suggestion: extend Sunday hours a bit later. Otherwise perfect for regular medicines.',
    verified: true,
    tags: ['Honest Pricing', 'No Upselling', 'Regular Customer']
  },
  {
    id: 9,
    name: 'Anjali Thomas',
    avatar: 'AT',
    rating: 5,
    date: '2 days ago',
    text: 'Emergency delivery at 9 PM for my son\'s fever medicine! Called them in panic, they had it ready in 15 mins and delivery boy reached in 30 mins. The pharmacist messaged dosage instructions on WhatsApp. This kind of service at night is priceless for parents. Thank you team!',
    verified: true,
    tags: ['Emergency Delivery', 'Night Service', 'Parent Approved']
  },
  {
    id: 10,
    name: 'Vijayan Pillai',
    avatar: 'VP',
    rating: 5,
    date: '1 month ago',
    text: 'Senior citizen discount + membership = huge savings! I\'m 72 and on 6 medicines monthly. The Platinum plan covers my wife too. Home delivery means I don\'t need to walk to the store. They call every month to confirm refills. This is how healthcare should be for seniors.',
    verified: true,
    tags: ['Senior Citizen', 'Platinum Member', 'Monthly Refill']
  },
  {
    id: 11,
    name: 'Sneha Reddy',
    avatar: 'SR',
    rating: 4,
    date: '3 weeks ago',
    text: 'Great experience with vitamin D and B12 test booking. Sample collected at 7 AM before work, reports by evening. The report format is easy to understand with normal ranges highlighted. Pharmacist called to explain my low Vitamin D and suggested supplements. Very thorough.',
    verified: true,
    tags: ['Lab Tests', 'Early Morning', 'Report Explanation']
  },
  {
    id: 12,
    name: 'Thomas Mathew',
    avatar: 'TM',
    rating: 5,
    date: '2 months ago',
    text: 'Reliable for chronic medicines. My father has been getting his Parkinson\'s meds from here for 2 years. Never a stock-out, always on time, and they coordinate with his neurologist for prescription renewals. The peace of mind is worth everything. Thank you Dhiya\'s team.',
    verified: true,
    tags: ['Chronic Care', 'Reliable Stock', 'Doctor Coordination']
  },
  {
    id: 13,
    name: 'Deepa Krishnan',
    avatar: 'DK',
    rating: 5,
    date: '1 week ago',
    text: 'Ordered pediatric syrup for my 3-year-old. They confirmed the exact dosage based on weight, not just age. Packed it carefully with ice pack since it needed cooling. Even included a spoon measure! Such attention to detail for a ₹120 medicine. Earned my loyalty.',
    verified: true,
    tags: ['Pediatric Care', 'Proper Dosage', 'Attention to Detail']
  },
  {
    id: 14,
    name: 'Ravi Chandran',
    avatar: 'RC',
    rating: 4,
    date: '2 weeks ago',
    text: 'Good pharmacy, been a customer for a year. Medicines are always genuine, delivery is mostly on time. The Gold membership pays for itself in 2 months. Only issue: sometimes the app shows "out of stock" but they have it in store. Call them directly for urgent needs.',
    verified: true,
    tags: ['Gold Member', 'Genuine Medicines', 'Call for Urgent']
  },
  {
    id: 15,
    name: 'Shanthi Devi',
    avatar: 'SD',
    rating: 5,
    date: '3 days ago',
    text: 'My husband had a prescription for a rare medicine not available locally. They sourced it from their Chennai warehouse and delivered in 2 days! No extra charge. The pharmacist followed up daily to check if it arrived. This kind of effort for one customer is amazing.',
    verified: true,
    tags: ['Rare Medicine', 'Inter-city Sourcing', 'Follow Up']
  }
];

const stats = {
  averageRating: 4.8,
  totalReviews: 147,
  ratingDistribution: { 5: 112, 4: 28, 3: 5, 2: 1, 1: 1 },
  highlightStats: [
    { label: 'On-time Delivery', value: '96%' },
    { label: 'Medicine Quality', value: '99%' },
    { label: 'Customer Support', value: '4.9/5' },
    { label: 'Would Recommend', value: '98%' },
  ]
};

export function GoogleReviews() {
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredReviews = reviews.filter(r => filterRating === 0 || r.rating === filterRating);
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  const displayedReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;

  useEffect(() => { setVisibleCount(6); }, [filterRating, sortBy]);

  const renderStars = (rating) => (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < rating ? '#FBBF24' : 'var(--border)'} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Google Reviews
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: '600px', margin: '0 auto' }}>
          Real reviews from our customers in Thisuur, Ollur, and surrounding areas
        </p>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{stats.averageRating}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '8px' }}>
              {renderStars(Math.round(stats.averageRating))}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>{stats.totalReviews} reviews · 4.8 average</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
            {Object.entries(stats.ratingDistribution).map(([star, count]) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '30px', textAlign: 'right', fontSize: '14px', color: 'var(--text-muted)' }}>{star}★</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / stats.totalReviews) * 100}%`, height: '100%', background: '#FBBF24', borderRadius: '4px', transition: 'width 500ms ease' }} />
                </div>
                <span style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)' }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '24px' }}>
            {stats.highlightStats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[0, 5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              className={`btn ${filterRating === rating ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterRating(rating)}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              {rating === 0 ? 'All' : `${rating}★`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['recent', 'highest', 'lowest'].map(sort => (
            <button
              key={sort}
              className={`btn ${sortBy === sort ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSortBy(sort)}
              style={{ fontSize: '13px', padding: '8px 14px' }}
            >
              {sort === 'recent' ? 'Most Recent' : sort === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {displayedReviews.map(review => (
          <article key={review.id} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '16px', flexShrink: 0 }}>
                {review.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '16px' }}>{review.name}</strong>
                  {review.verified && <span className="badge badge-success" style={{ fontSize: '10px' }}>Verified Purchase</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {renderStars(review.rating)}
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{review.date}</span>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 16px', lineHeight: 1.6, color: 'var(--text)' }}>{review.text}</p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {review.tags.map((tag, i) => (
                <span key={i} className="badge badge-info" style={{ fontSize: '11px' }}>{tag}</span>
              ))}
            </div>
          </article>
        ))}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setVisibleCount(prev => prev + 6)}
              style={{ padding: '12px 32px' }}
            >
              Load {Math.min(6, sortedReviews.length - visibleCount)} More Reviews
            </button>
          </div>
        )}

        {filteredReviews.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No reviews match your filter.</p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', padding: '40px 24px', background: 'linear-gradient(135deg, var(--primary-light), #ecfdf5)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ margin: '0 0 12px', color: 'var(--primary)', fontSize: '24px' }}>Share Your Experience</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
          Your feedback helps us improve and helps other families make informed healthcare choices.
        </p>
        <a href="https://g.page/r/CjVX1234567890/review" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
          Write a Review on Google
        </a>
      </div>
    </div>
  );
}