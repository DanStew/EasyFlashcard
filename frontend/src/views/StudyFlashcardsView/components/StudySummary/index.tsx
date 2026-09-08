import { ArrowLeft, Award, RotateCcw, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import type { StudySummaryProps } from './types';
import { getCelebrationMessage } from './utils';
import './style.scss';

export function StudySummary({
  stats,
  starredCount,
  perSetStats,
  onRestartAll,
  onRestartRetryOnly,
  onRestartStarredOnly,
  onExit,
}: StudySummaryProps) {
  const { title, subtitle } = getCelebrationMessage(stats.masteryPercentage);
  const hasRetry = stats.retryCount > 0;
  const hasStarred = starredCount > 0;

  return (
    <div className="study-summary" role="region" aria-label="Study session round complete">
      <div className="study-summary__badge-icon">
        {stats.masteryPercentage === 100 ? <Award size={32} /> : <Sparkles size={32} />}
      </div>

      <h2 className="study-summary__title">{title}</h2>
      <p className="study-summary__subtitle">{subtitle}</p>

      {/* Big Score Callout */}
      <div className="study-summary__score-card">
        <span className="study-summary__score-value">{stats.masteryPercentage}%</span>
        <span className="study-summary__score-label">Mastery Rate</span>
      </div>

      {/* Grid breakdown */}
      <div className="study-summary__stats-grid">
        <div className="study-summary__stat-card">
          <span className="study-summary__stat-num">{stats.totalCards}</span>
          <span className="study-summary__stat-text">Total Cards</span>
        </div>

        <div className="study-summary__stat-card study-summary__stat-card--mastered">
          <span className="study-summary__stat-num">{stats.masteredCount}</span>
          <span className="study-summary__stat-text">Mastered</span>
        </div>

        <div className="study-summary__stat-card study-summary__stat-card--retry">
          <span className="study-summary__stat-num">{stats.retryCount}</span>
          <span className="study-summary__stat-text">Needs Practice</span>
        </div>
      </div>

      {/* Multi-Set Mastery Breakdown */}
      {perSetStats && perSetStats.length > 1 && (
        <div className="study-summary__sets-breakdown">
          <h3 className="study-summary__sets-title">Mastery by Set</h3>
          <div className="study-summary__sets-list">
            {perSetStats.map((item) => (
              <div key={item.set.id} className="study-summary__set-row">
                <div className="study-summary__set-info">
                  <span className="study-summary__set-name">{item.set.name}</span>
                  <span className="study-summary__set-detail">
                    {item.masteredCount} of {item.totalCards} cards mastered
                  </span>
                </div>
                <span
                  className={`study-summary__set-rate ${
                    item.masteryPercentage >= 80
                      ? 'study-summary__set-rate--high'
                      : item.masteryPercentage >= 50
                      ? 'study-summary__set-rate--mid'
                      : 'study-summary__set-rate--low'
                  }`}
                >
                  {item.masteryPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="study-summary__actions">
        {hasRetry && (
          <Button
            variant="gradient"
            size="lg"
            leftIcon={<RotateCcw size={18} />}
            onClick={onRestartRetryOnly}
            fullWidth
          >
            Study Needs Practice Cards ({stats.retryCount})
          </Button>
        )}

        <div className="study-summary__actions-row">
          <Button
            variant={hasRetry ? 'secondary' : 'gradient'}
            size={hasRetry ? 'md' : 'lg'}
            leftIcon={<RotateCcw size={16} />}
            onClick={onRestartAll}
            fullWidth={!hasRetry}
          >
            Restart Full Set ({stats.totalCards})
          </Button>

          {hasStarred && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Star size={16} />}
              onClick={onRestartStarredOnly}
            >
              Study Starred ({starredCount})
            </Button>
          )}

          <Button
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onExit}
          >
            Back to Set
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { StudySummaryProps } from './types';
