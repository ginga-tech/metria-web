# Implementation Plan

## Overview
Fix Stripe payment return flow by implementing a webhook-first approach to ensure subscription data is persisted before user redirection, eliminating timing issues between webhook processing and frontend sync operations.

The current issue occurs when Stripe redirects users to `/dashboard?checkout=success` but the `checkout.session.completed` webhook hasn't been processed yet, causing the frontend sync to fail because no subscription data exists in the database. This implementation will optimize webhook processing, add webhook retry mechanisms, improve error handling, and ensure reliable subscription persistence before user redirection.

## Types
Define enhanced webhook processing and subscription synchronization data structures.

```csharp
// Enhanced webhook event processing status
public enum WebhookProcessingStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    Retrying
}

// Webhook processing result for logging and monitoring
public class WebhookProcessingResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? SubscriptionId { get; set; }
    public Guid? UserId { get; set; }
    public DateTime ProcessedAt { get; set; }
}

// Enhanced sync request with retry capabilities
public record EnhancedSyncReq(
    string? SubscriptionId, 
    string? CustomerId, 
    string? Email,
    int RetryCount = 0,
    bool ForceRefresh = false
);

// Subscription sync result with detailed status
public class SubscriptionSyncResult
{
    public bool Success { get; set; }
    public string? SubscriptionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public bool RequiresRetry { get; set; }
}
```

## Files
Modify existing backend webhook processing and add enhanced error handling mechanisms.

**Modified Files:**
- `C:\repos\lifebalance-project\LifeBalance\src\LifeBalance.Api\Program.cs`
  - Enhance webhook endpoint with better error handling and logging
  - Add webhook processing retry mechanism
  - Improve subscription sync endpoint with enhanced error recovery
  - Add webhook processing status tracking
  - Implement idempotency for webhook events

**New Files:**
- `C:\repos\lifebalance-project\LifeBalance\src\LifeBalance.Api\Services\IWebhookProcessingService.cs`
  - Interface for webhook processing service
- `C:\repos\lifebalance-project\LifeBalance\src\LifeBalance.Api\Services\WebhookProcessingService.cs`
  - Dedicated service for handling webhook processing logic
  - Implements retry mechanisms and error recovery
- `C:\repos\lifebalance-project\LifeBalance\src\LifeBalance.Api\Models\WebhookEvent.cs`
  - Model for tracking webhook processing status and history

**Frontend Files (Minor Updates):**
- `src/App.tsx` - Enhance checkout success handling with better error recovery
- `src/services/billingService.ts` - Add enhanced sync with retry capabilities

## Functions
Enhance webhook processing and subscription synchronization functions.

**New Functions:**
- `ProcessWebhookEventAsync(Event stripeEvent, CancellationToken cancellationToken)` in `WebhookProcessingService.cs`
  - Centralized webhook event processing with error handling
- `RetryWebhookProcessingAsync(string eventId, int maxRetries)` in `WebhookProcessingService.cs`
  - Implements retry logic for failed webhook processing
- `ValidateWebhookIdempotency(string eventId)` in `WebhookProcessingService.cs`
  - Prevents duplicate processing of webhook events
- `EnhancedSyncSubscriptionAsync(EnhancedSyncReq request)` in `Program.cs`
  - Enhanced sync endpoint with better error handling and retry logic

**Modified Functions:**
- `/api/billing/webhook` endpoint in `Program.cs`
  - Add comprehensive error handling and logging
  - Implement idempotency checking
  - Add processing status tracking
  - Improve subscription data extraction and validation
- `/api/billing/sync` endpoint in `Program.cs`
  - Enhanced error recovery mechanisms
  - Better Stripe API error handling
  - Improved user resolution logic
  - Add retry capabilities for transient failures

## Classes
Add new service classes for webhook processing and enhance existing models.

**New Classes:**
- `WebhookProcessingService` in `Services/WebhookProcessingService.cs`
  - Handles all webhook processing logic
  - Implements retry mechanisms and error recovery
  - Provides comprehensive logging and monitoring
- `WebhookEvent` in `Models/WebhookEvent.cs`
  - Tracks webhook processing status and history
  - Stores processing attempts and results
  - Enables webhook processing monitoring and debugging

**Modified Classes:**
- `Subscription` model (if needed for additional tracking fields)
  - Add webhook processing correlation fields if required

## Dependencies
No new external dependencies required - leveraging existing Stripe SDK and Entity Framework.

**Existing Dependencies:**
- Stripe.net SDK (already configured)
- Entity Framework Core (for webhook event tracking)
- Microsoft.Extensions.Logging (for enhanced logging)
- System.Text.Json (for webhook payload processing)

**Configuration Requirements:**
- Ensure `STRIPE_WEBHOOK_SECRET` environment variable is properly configured
- Verify webhook endpoint URL is registered in Stripe dashboard
- Configure appropriate webhook event types in Stripe (checkout.session.completed, customer.subscription.*)

## Testing
Comprehensive testing approach for webhook processing and subscription synchronization.

**Test Categories:**
1. **Webhook Processing Tests**
   - Test successful webhook event processing
   - Test webhook signature validation
   - Test idempotency handling (duplicate events)
   - Test error scenarios and retry mechanisms

2. **Subscription Sync Tests**
   - Test successful subscription synchronization
   - Test error recovery and retry logic
   - Test user resolution from various identifiers
   - Test Stripe API error handling

3. **Integration Tests**
   - Test complete payment flow from checkout to subscription persistence
   - Test webhook processing timing and reliability
   - Test frontend sync after successful webhook processing

4. **Error Scenario Tests**
   - Test webhook processing failures and recovery
   - Test network timeouts and Stripe API errors
   - Test database transaction failures and rollback

## Implementation Order
Sequential implementation steps to ensure reliable webhook-first processing.

1. **Create Webhook Processing Infrastructure**
   - Create `IWebhookProcessingService` interface
   - Implement `WebhookProcessingService` class
   - Add `WebhookEvent` model for tracking
   - Update database context and run migrations

2. **Enhance Webhook Endpoint**
   - Refactor `/api/billing/webhook` to use new service
   - Add comprehensive error handling and logging
   - Implement idempotency checking
   - Add webhook processing status tracking

3. **Improve Subscription Sync Endpoint**
   - Enhance `/api/billing/sync` with better error handling
   - Add retry mechanisms for transient failures
   - Improve user resolution logic
   - Add detailed error reporting

4. **Add Webhook Processing Retry Logic**
   - Implement retry mechanisms for failed webhook processing
   - Add exponential backoff for retry attempts
   - Add maximum retry limits and failure handling
   - Implement webhook processing monitoring

5. **Enhance Frontend Error Handling**
   - Update `CheckoutAutoClose` component for better error recovery
   - Enhance `syncSubscription` service with retry capabilities
   - Add better user feedback for sync failures
   - Improve polling logic and timeout handling

6. **Testing and Validation**
   - Test webhook processing with various Stripe events
   - Validate idempotency and retry mechanisms
   - Test complete payment flow end-to-end
   - Verify error scenarios and recovery paths

7. **Monitoring and Logging**
   - Add comprehensive logging for webhook processing
   - Implement webhook processing metrics and monitoring
   - Add alerting for webhook processing failures
   - Create debugging tools for webhook event tracking

8. **Documentation and Deployment**
   - Document webhook configuration requirements
   - Update deployment scripts for new environment variables
   - Create troubleshooting guide for webhook issues
   - Deploy and monitor in production environment
