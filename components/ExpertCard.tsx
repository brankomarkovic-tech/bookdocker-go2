import React from 'react';
import { Link } from 'react-router-dom';
import { Expert, SubscriptionTier } from '../types';
import { OnLeaveIcon, SparklesIcon, PresentIcon } from './icons';
import { getExpertSlug } from '../utils/slug';
import { useAppContext } from '../hooks/useAppContext';

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ expert }) => {
  const { experts } = useAppContext();
  const isPremium = expert.subscriptionTier === SubscriptionTier.PREMIUM;
  const slug = getExpertSlug(expert, experts);

  return (
    <Link
      to={`/profile/${slug}`}
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer flex flex-col relative text-left no-underline block"
      aria-label={`View profile for ${expert.name}`}
    >
        {isPremium && expert.onLeave && (
            <div className="absolute top-0 right-0 w-16 h-16" title="Expert is On Leave">
                <div className="absolute w-full h-full bg-blue-600" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%)'}}></div>
                <OnLeaveIcon className="absolute top-1 right-1 w-5 h-5 text-white" />
            </div>
        )}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center space-x-4">
          <img
            className="w-16 h-16 rounded-full object-cover border-2 border-customBlue-500"
            src={expert.avatarUrl}
            alt={expert.name}
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-xl font-bold text-gray-900">{expert.name}</h2>
              {isPremium && (
                <span title="Premium Expert">
                  <SparklesIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-customBlue-600">{expert.genre}</p>
             {expert.presentBookId && (
                <div className="flex items-center gap-1 mt-1" title="Has a book on special offer">
                    <PresentIcon className="w-4 h-4 text-[#d10a4d]" />
                    <span className="text-xs font-semibold text-[#d10a4d]">Special Offer</span>
                </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 mt-4 text-sm line-clamp-4 flex-grow">{expert.bio}</p>
      </div>
    </Link>
  );
};

export default ExpertCard;
