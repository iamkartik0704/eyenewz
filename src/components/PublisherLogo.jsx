import React, { useEffect, useState } from 'react';
import { publisherInitial, resolvePublisherLogo } from '../lib/article';

function PublisherLogo({ article, size = 40 }) {
  const publisher = article?.publisherName || "Publisher";
  const initial = publisherInitial(publisher);
  const logoUrl = resolvePublisherLogo(article);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [article?.id, logoUrl]);

  if (!logoUrl || failed) {
    return (
      <span
        className="pub-avatar"
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: size > 40 ? "1.1rem" : undefined }}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      className="pub-logo"
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
    />
  );
}

export default PublisherLogo;
