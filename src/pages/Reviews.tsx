import { MessageCircle, Sparkles } from 'lucide-react';

const Reviews = () => {
    return (
        <div className="feed-container">
            <div className="inbox-header">
                <div>
                    <h1>
                        <MessageCircle size={28} className="text-primary-400" />
                        Discussions
                    </h1>
                    <p>Review products and chat with friends</p>
                </div>
            </div>

            <div className="empty-state">
                <div className="empty-state-icon">
                    <Sparkles size={32} />
                </div>
                <h3>Start a Discussion</h3>
                <p>
                    Select a product from your feed or orders to start a review or chat about it.
                </p>
                {/* Future: Add 'Start Review' button selecting from Order history */}
            </div>
        </div>
    );
};

export default Reviews;
