export type RequestStatus = "pending" | "allocated" | "not-selected";

export interface FoodRequest {
  id: string;
  title: string;
  vendor: string;
  pickupWindow: string;
  imageUrl?: string;
  requestedOn?: string;
  funding?: string;
  status: RequestStatus;
}

interface RequestCardProps {
  request: FoodRequest;
}

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending review",
  allocated: "Allocated",
  "not-selected": "Not selected",
};

export function RequestCard({ request }: RequestCardProps) {
  return (
    <article className="request-card">
      {request.imageUrl ? (
        <img className="request-card__image" src={request.imageUrl} alt="" />
      ) : (
        <div className="request-card__image request-card__image--placeholder" aria-hidden="true" />
      )}
      <div className="request-card__body">
        <h3 className="request-card__title">{request.title}</h3>
        <p className="request-card__vendor">{request.vendor}</p>
        <p className="request-card__pickup">{request.pickupWindow}</p>
        {request.funding && <p className="request-card__funding">{request.funding}</p>}
      </div>
      <div className="request-card__details">
        <span className={`status-badge status-badge--${request.status}`}>{statusLabels[request.status]}</span>
        {request.requestedOn && <time className="request-card__date">{request.requestedOn}</time>}
      </div>
    </article>
  );
}
