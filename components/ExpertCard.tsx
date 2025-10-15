import React from 'react';
import { Expert, SubscriptionTier } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { OnLeaveIcon, SparklesIcon, PresentIcon } from './icons';

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ expert }) => {
  const { navigateToProfile } = useAppContext();
  const isPremium = expert.subscriptionTier === SubscriptionTier.PREMIUM;

  return (
    <div
      onClick={() => navigateToProfile(expert.id)}
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer flex flex-col relative"
      aria-label={`View profile for ${expert.name}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToProfile(expert.id)}
    >
        {isPremium && expert.onLeave && (
            <div className="absolute top-0 right-0 w-16 h-16" title="Expert is On Leave">
                 <div className="absolute w-full h-full bg-green-500" style={{clipPath: 'polygon(100% 0, 0 0, 100% 100%)'}}></div>
                <OnLeaveIcon className="absolute top-2 right-2 w-5 h-5 text-white" />
            </div>
        )}

        {isPremium && expert.presentOffer && (
            <div className="absolute top-0 left-0 w-16 h-16" title="Special Offer Available">
                <div className="absolute w-full h-full" style={{backgroundColor: '#d10a4d', clipPath: 'polygon(0 0, 100% 0, 0 100%)'}}></div>
                <PresentIcon className="absolute top-2 left-2 w-5 h-5 text-white" />
            </div>
        )}

      <div className="p-6 flex flex-col flex-grow items-center text-center pt-6">
        <img className="w-24 h-24 rounded-full object-cover mb-4 shadow-md ring-4 ring-customBlue-100" src={expert.avatarUrl} alt={expert.name} />
        <h3 className="text-xl font-bold text-gray-900">{expert.name}</h3>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 bg-customBlue-100 text-customBlue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {isPremium && <SparklesIcon className="w-4 h-4 text-yellow-500" />}
            {expert.genre} GO2
          </span>
        </div>

        {expert.bookQuery?.title && (
            <div className="mt-4 p-2 bg-[#d7fcea] rounded-md w-full" title={`Searching for: ${expert.bookQuery.title} by ${expert.bookQuery.author}`}>
                 <p className="text-xs font-semibold text-green-900">Searching For:</p>
                 <p className="text-xs text-gray-700 truncate">{expert.bookQuery.title}</p>
            </div>
        )}

        <p className="text-gray-600 mt-4 text-sm line-clamp-4 flex-grow">{expert.bio}</p>
      </div>
       {expert.isExample && (
        <div className="absolute bottom-3 right-3 bg-customBlue-600 bg-opacity-75 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
            Example
        </div>
      )}
    </div>
  );
};

export default ExpertCard;