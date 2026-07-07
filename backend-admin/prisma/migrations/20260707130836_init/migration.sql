-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'sub_admin', 'pro_user', 'user');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('email', 'phone', 'google', 'apple');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('android', 'ios', 'web');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('promotion', 'ad', 'announcement');

-- CreateEnum
CREATE TYPE "LikeStatus" AS ENUM ('like', 'dislike');

-- CreateEnum
CREATE TYPE "CommunityUserRole" AS ENUM ('admin', 'moderator', 'member');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('verification', 'password_reset', 'welcome', 'notification', 'admin', 'bulk', 'system');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'queued', 'processing', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked');

-- CreateEnum
CREATE TYPE "SmsType" AS ENUM ('verification', 'password_reset');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('sent', 'failed');

-- CreateEnum
CREATE TYPE "PointsReason" AS ENUM ('question_created', 'poll_created', 'answer_created');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('notification', 'email', 'push', 'sms', 'bulk_notification', 'bulk_email', 'scheduled_notification', 'email_retry', 'template_render');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'document', 'audio', 'other');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('local', 's3', 'cloudinary');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('comment', 'reply', 'like', 'follow', 'mention', 'post_approved', 'comment_approved', 'community_invite', 'poll_ended', 'subscription_expired', 'system', 'admin');

-- CreateEnum
CREATE TYPE "PushStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationDeviceType" AS ENUM ('android', 'ios', 'web');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('draft', 'published', 'ended');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('post', 'question');

-- CreateEnum
CREATE TYPE "ProfileGender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('free', 'pro', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionDurationType" AS ENUM ('days', 'weeks', 'months', 'years');

-- CreateEnum
CREATE TYPE "SubscriptionRenewalType" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('email', 'pdf', 'html', 'sms');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('verification', 'password_reset', 'welcome', 'notification', 'invoice', 'report', 'custom');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "password_hash" VARCHAR(255),
    "auth_type" "AuthType" NOT NULL DEFAULT 'email',
    "google_id" VARCHAR(255),
    "apple_id" VARCHAR(255),
    "access_token" VARCHAR(500),
    "refresh_token" VARCHAR(500),
    "expires_in" INTEGER NOT NULL DEFAULT 3600,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(6),
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_verification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "verification_code" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_password_reset" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "phone_number" VARCHAR(255),
    "email" VARCHAR(255),
    "reset_code" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_password_reset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "device_token" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(6),
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "full_name" VARCHAR(255),
    "profile_picture" VARCHAR(500),
    "profile_background" VARCHAR(500),
    "tagline" VARCHAR(255),
    "profile_bio" TEXT,
    "profile_gender" "ProfileGender",
    "profile_birthday" DATE,
    "profile_website" VARCHAR(500),
    "profile_location" VARCHAR(255),
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_followers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "follower_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topics" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" VARCHAR(255) NOT NULL,
    "setting_value" TEXT,
    "setting_group" VARCHAR(255) NOT NULL DEFAULT 'general',
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "banner_title" VARCHAR(255),
    "banner_description" TEXT,
    "banner_image" VARCHAR(500) NOT NULL,
    "banner_link" VARCHAR(500),
    "banner_type" "BannerType" NOT NULL DEFAULT 'promotion',
    "target_countries" VARCHAR(500),
    "target_topic_ids" VARCHAR(500),
    "target_subscription_ids" VARCHAR(500),
    "excluded_countries" VARCHAR(500),
    "excluded_topic_ids" VARCHAR(500),
    "excluded_subscription_ids" VARCHAR(500),
    "valid_from" TIMESTAMP(6),
    "valid_until" TIMESTAMP(6),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER NOT NULL DEFAULT 0,
    "topic_slug" VARCHAR(255) NOT NULL,
    "topic_name" VARCHAR(255) NOT NULL,
    "topic_description" TEXT,
    "topic_image" VARCHAR(500),
    "is_trending" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" SERIAL NOT NULL,
    "community_slug" VARCHAR(255) NOT NULL,
    "community_name" VARCHAR(255) NOT NULL,
    "community_description" TEXT,
    "community_image" VARCHAR(500),
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "is_trending" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_topics" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "community_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_users" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "CommunityUserRole" NOT NULL DEFAULT 'member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "community_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" SERIAL NOT NULL,
    "currency_name" VARCHAR(255) NOT NULL,
    "currency_code" VARCHAR(10) NOT NULL,
    "currency_symbol" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_posts" (
    "id" SERIAL NOT NULL,
    "community_ids" VARCHAR(500),
    "user_id" INTEGER NOT NULL,
    "post_slug" VARCHAR(255) NOT NULL,
    "post_title" VARCHAR(255) NOT NULL,
    "post_content" TEXT NOT NULL,
    "post_image" VARCHAR(500),
    "post_video" VARCHAR(500),
    "post_audio" VARCHAR(500),
    "post_link" VARCHAR(500),
    "post_status" "PostStatus" NOT NULL DEFAULT 'draft',
    "post_type" "PostType" NOT NULL DEFAULT 'post',
    "post_topic_id" INTEGER,
    "post_tags" VARCHAR(500),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "dislike_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "like_status" "LikeStatus" NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_comment_id" INTEGER,
    "comment_content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "dislike_count" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments_likes" (
    "id" SERIAL NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "like_status" "LikeStatus" NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "comments_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_polls" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "community_ids" VARCHAR(500),
    "poll_slug" VARCHAR(255) NOT NULL,
    "poll_title" VARCHAR(255) NOT NULL,
    "poll_description" TEXT NOT NULL,
    "poll_expires_at" TIMESTAMP(6),
    "poll_status" "PollStatus" NOT NULL DEFAULT 'draft',
    "poll_winner_option_id" INTEGER,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vote_option_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_likes" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "like_status" "LikeStatus" NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "poll_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_comments" (
    "id" SERIAL NOT NULL,
    "poll_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_comment_id" INTEGER,
    "comment_content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "dislike_count" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "poll_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "subscription_type" "SubscriptionType" NOT NULL,
    "subscription_name" VARCHAR(255) NOT NULL,
    "subscription_description" TEXT,
    "subscription_price" DECIMAL(10,2) NOT NULL,
    "subscription_duration" INTEGER NOT NULL,
    "subscription_duration_type" "SubscriptionDurationType" NOT NULL,
    "subscription_currency" VARCHAR(10),
    "currency_id" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "subscription_start_date" TIMESTAMP(6),
    "subscription_end_date" TIMESTAMP(6),
    "subscription_renewal_type" "SubscriptionRenewalType" NOT NULL,
    "subscription_renewal_date" TIMESTAMP(6),
    "subscription_renewal_amount" DECIMAL(10,2) NOT NULL,
    "subscription_renewal_currency" VARCHAR(10) NOT NULL,
    "subscription_renewal_gateway" VARCHAR(255) NOT NULL,
    "subscription_status" "SubscriptionStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "users_subscriptions_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_currency" VARCHAR(10) NOT NULL,
    "currency_id" INTEGER,
    "payment_gateway" VARCHAR(255) NOT NULL,
    "payment_transaction_id" VARCHAR(255) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER,
    "user_id" INTEGER,
    "email_type" "EmailType" NOT NULL,
    "recipient_email" VARCHAR(255) NOT NULL,
    "recipient_name" VARCHAR(255),
    "subject" VARCHAR(500) NOT NULL,
    "body_html" TEXT,
    "body_text" TEXT,
    "template_name" VARCHAR(255),
    "template_data" JSONB,
    "from_email" VARCHAR(255) NOT NULL,
    "from_name" VARCHAR(255),
    "reply_to" VARCHAR(255),
    "cc_emails" JSONB,
    "bcc_emails" JSONB,
    "attachments" JSONB,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(100),
    "provider_message_id" VARCHAR(255),
    "error_message" TEXT,
    "sent_at" TIMESTAMP(6),
    "delivered_at" TIMESTAMP(6),
    "opened_at" TIMESTAMP(6),
    "clicked_at" TIMESTAMP(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(6),
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_messages" (
    "id" SERIAL NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "sms_type" "SmsType" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'sent',
    "provider_response" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" "PointsReason" NOT NULL,
    "related_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "action_url" VARCHAR(500),
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "push_status" "PushStatus",
    "device_id" INTEGER,
    "device_token" VARCHAR(500),
    "device_type" "NotificationDeviceType",
    "fcm_message_id" VARCHAR(255),
    "apns_id" VARCHAR(255),
    "push_sent_at" TIMESTAMP(6),
    "push_delivered_at" TIMESTAMP(6),
    "push_error_message" TEXT,
    "email_id" INTEGER,
    "email_sent_at" TIMESTAMP(6),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "expires_at" TIMESTAMP(6),
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "job_type" "JobType" NOT NULL,
    "job_status" "JobStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "payload" JSONB NOT NULL,
    "notification_id" INTEGER,
    "email_id" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "error_details" JSONB,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "scheduled_at" TIMESTAMP(6),
    "next_retry_at" TIMESTAMP(6),
    "logs" JSONB,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "storage_type" "StorageType" NOT NULL DEFAULT 'local',
    "status" "MediaStatus" NOT NULL DEFAULT 'pending',
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "thumbnail_path" VARCHAR(500),
    "optimized_path" VARCHAR(500),
    "uuid" VARCHAR(36) NOT NULL,
    "file_hash" VARCHAR(64),
    "uploaded_by" INTEGER,
    "folder" VARCHAR(255),
    "metadata" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_policy" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "privacy_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "website" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "type" "TemplateType" NOT NULL,
    "category" "TemplateCategory" NOT NULL DEFAULT 'custom',
    "subject" VARCHAR(500),
    "content" TEXT NOT NULL,
    "text_content" TEXT,
    "variables" JSONB,
    "default_data" JSONB,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_auth_type_idx" ON "users"("auth_type");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_is_verified_idx" ON "users"("is_verified");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_verification_user_id_idx" ON "user_verification"("user_id");

-- CreateIndex
CREATE INDEX "user_verification_verification_code_idx" ON "user_verification"("verification_code");

-- CreateIndex
CREATE INDEX "user_verification_expires_at_idx" ON "user_verification"("expires_at");

-- CreateIndex
CREATE INDEX "user_verification_is_used_idx" ON "user_verification"("is_used");

-- CreateIndex
CREATE INDEX "user_verification_created_at_idx" ON "user_verification"("created_at");

-- CreateIndex
CREATE INDEX "user_password_reset_user_id_idx" ON "user_password_reset"("user_id");

-- CreateIndex
CREATE INDEX "user_password_reset_phone_number_idx" ON "user_password_reset"("phone_number");

-- CreateIndex
CREATE INDEX "user_password_reset_email_idx" ON "user_password_reset"("email");

-- CreateIndex
CREATE INDEX "user_password_reset_reset_code_idx" ON "user_password_reset"("reset_code");

-- CreateIndex
CREATE INDEX "user_password_reset_expires_at_idx" ON "user_password_reset"("expires_at");

-- CreateIndex
CREATE INDEX "user_password_reset_is_used_idx" ON "user_password_reset"("is_used");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_device_id_idx" ON "user_devices"("device_id");

-- CreateIndex
CREATE INDEX "user_devices_device_type_idx" ON "user_devices"("device_type");

-- CreateIndex
CREATE INDEX "user_devices_is_active_idx" ON "user_devices"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_user_id_key" ON "user_profile"("user_id");

-- CreateIndex
CREATE INDEX "user_followers_user_id_idx" ON "user_followers"("user_id");

-- CreateIndex
CREATE INDEX "user_followers_follower_id_idx" ON "user_followers"("follower_id");

-- CreateIndex
CREATE INDEX "user_followers_is_active_idx" ON "user_followers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_followers_user_id_follower_id_key" ON "user_followers"("user_id", "follower_id");

-- CreateIndex
CREATE INDEX "user_topics_user_id_idx" ON "user_topics"("user_id");

-- CreateIndex
CREATE INDEX "user_topics_topic_id_idx" ON "user_topics"("topic_id");

-- CreateIndex
CREATE INDEX "user_topics_is_active_idx" ON "user_topics"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_topics_user_id_topic_id_key" ON "user_topics"("user_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_setting_key_key" ON "app_settings"("setting_key");

-- CreateIndex
CREATE INDEX "app_settings_setting_group_idx" ON "app_settings"("setting_group");

-- CreateIndex
CREATE INDEX "banners_banner_type_idx" ON "banners"("banner_type");

-- CreateIndex
CREATE INDEX "banners_display_order_idx" ON "banners"("display_order");

-- CreateIndex
CREATE INDEX "banners_is_active_idx" ON "banners"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "topics_topic_slug_key" ON "topics"("topic_slug");

-- CreateIndex
CREATE INDEX "topics_parent_id_idx" ON "topics"("parent_id");

-- CreateIndex
CREATE INDEX "topics_topic_name_idx" ON "topics"("topic_name");

-- CreateIndex
CREATE INDEX "topics_is_active_idx" ON "topics"("is_active");

-- CreateIndex
CREATE INDEX "topics_is_trending_idx" ON "topics"("is_trending");

-- CreateIndex
CREATE UNIQUE INDEX "communities_community_slug_key" ON "communities"("community_slug");

-- CreateIndex
CREATE INDEX "communities_community_name_idx" ON "communities"("community_name");

-- CreateIndex
CREATE INDEX "communities_is_active_idx" ON "communities"("is_active");

-- CreateIndex
CREATE INDEX "communities_is_trending_idx" ON "communities"("is_trending");

-- CreateIndex
CREATE INDEX "communities_member_count_idx" ON "communities"("member_count");

-- CreateIndex
CREATE INDEX "communities_created_at_idx" ON "communities"("created_at");

-- CreateIndex
CREATE INDEX "community_topics_community_id_idx" ON "community_topics"("community_id");

-- CreateIndex
CREATE INDEX "community_topics_topic_id_idx" ON "community_topics"("topic_id");

-- CreateIndex
CREATE INDEX "community_topics_is_active_idx" ON "community_topics"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "community_topics_community_id_topic_id_key" ON "community_topics"("community_id", "topic_id");

-- CreateIndex
CREATE INDEX "community_users_community_id_idx" ON "community_users"("community_id");

-- CreateIndex
CREATE INDEX "community_users_user_id_idx" ON "community_users"("user_id");

-- CreateIndex
CREATE INDEX "community_users_role_idx" ON "community_users"("role");

-- CreateIndex
CREATE INDEX "community_users_is_active_idx" ON "community_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "community_users_community_id_user_id_key" ON "community_users"("community_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_currency_code_key" ON "currencies"("currency_code");

-- CreateIndex
CREATE INDEX "currencies_is_active_idx" ON "currencies"("is_active");

-- CreateIndex
CREATE INDEX "user_posts_user_id_idx" ON "user_posts"("user_id");

-- CreateIndex
CREATE INDEX "user_posts_post_slug_idx" ON "user_posts"("post_slug");

-- CreateIndex
CREATE INDEX "user_posts_post_status_idx" ON "user_posts"("post_status");

-- CreateIndex
CREATE INDEX "user_posts_post_type_idx" ON "user_posts"("post_type");

-- CreateIndex
CREATE INDEX "user_posts_post_topic_id_idx" ON "user_posts"("post_topic_id");

-- CreateIndex
CREATE INDEX "user_posts_view_count_idx" ON "user_posts"("view_count");

-- CreateIndex
CREATE INDEX "user_posts_like_count_idx" ON "user_posts"("like_count");

-- CreateIndex
CREATE INDEX "user_posts_is_featured_idx" ON "user_posts"("is_featured");

-- CreateIndex
CREATE INDEX "user_posts_created_at_idx" ON "user_posts"("created_at");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE INDEX "post_likes_like_status_idx" ON "post_likes"("like_status");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_idx" ON "post_comments"("post_id");

-- CreateIndex
CREATE INDEX "post_comments_user_id_idx" ON "post_comments"("user_id");

-- CreateIndex
CREATE INDEX "post_comments_parent_comment_id_idx" ON "post_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "post_comments_like_count_idx" ON "post_comments"("like_count");

-- CreateIndex
CREATE INDEX "post_comments_is_approved_idx" ON "post_comments"("is_approved");

-- CreateIndex
CREATE INDEX "post_comments_created_at_idx" ON "post_comments"("created_at");

-- CreateIndex
CREATE INDEX "comments_likes_comment_id_idx" ON "comments_likes"("comment_id");

-- CreateIndex
CREATE INDEX "comments_likes_user_id_idx" ON "comments_likes"("user_id");

-- CreateIndex
CREATE INDEX "comments_likes_like_status_idx" ON "comments_likes"("like_status");

-- CreateIndex
CREATE UNIQUE INDEX "comments_likes_comment_id_user_id_key" ON "comments_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "user_polls_user_id_idx" ON "user_polls"("user_id");

-- CreateIndex
CREATE INDEX "user_polls_poll_slug_idx" ON "user_polls"("poll_slug");

-- CreateIndex
CREATE INDEX "user_polls_poll_expires_at_idx" ON "user_polls"("poll_expires_at");

-- CreateIndex
CREATE INDEX "user_polls_poll_status_idx" ON "user_polls"("poll_status");

-- CreateIndex
CREATE INDEX "user_polls_vote_count_idx" ON "user_polls"("vote_count");

-- CreateIndex
CREATE INDEX "user_polls_is_featured_idx" ON "user_polls"("is_featured");

-- CreateIndex
CREATE INDEX "user_polls_created_at_idx" ON "user_polls"("created_at");

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "poll_options_vote_count_idx" ON "poll_options"("vote_count");

-- CreateIndex
CREATE INDEX "poll_options_display_order_idx" ON "poll_options"("display_order");

-- CreateIndex
CREATE INDEX "poll_options_is_active_idx" ON "poll_options"("is_active");

-- CreateIndex
CREATE INDEX "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");

-- CreateIndex
CREATE INDEX "poll_votes_user_id_idx" ON "poll_votes"("user_id");

-- CreateIndex
CREATE INDEX "poll_votes_vote_option_id_idx" ON "poll_votes"("vote_option_id");

-- CreateIndex
CREATE INDEX "poll_votes_created_at_idx" ON "poll_votes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_poll_id_user_id_key" ON "poll_votes"("poll_id", "user_id");

-- CreateIndex
CREATE INDEX "poll_likes_poll_id_idx" ON "poll_likes"("poll_id");

-- CreateIndex
CREATE INDEX "poll_likes_user_id_idx" ON "poll_likes"("user_id");

-- CreateIndex
CREATE INDEX "poll_likes_like_status_idx" ON "poll_likes"("like_status");

-- CreateIndex
CREATE UNIQUE INDEX "poll_likes_poll_id_user_id_key" ON "poll_likes"("poll_id", "user_id");

-- CreateIndex
CREATE INDEX "poll_comments_poll_id_idx" ON "poll_comments"("poll_id");

-- CreateIndex
CREATE INDEX "poll_comments_user_id_idx" ON "poll_comments"("user_id");

-- CreateIndex
CREATE INDEX "poll_comments_parent_comment_id_idx" ON "poll_comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "poll_comments_like_count_idx" ON "poll_comments"("like_count");

-- CreateIndex
CREATE INDEX "poll_comments_is_approved_idx" ON "poll_comments"("is_approved");

-- CreateIndex
CREATE INDEX "poll_comments_created_at_idx" ON "poll_comments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_name_key" ON "subscriptions"("subscription_name");

-- CreateIndex
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions"("created_at");

-- CreateIndex
CREATE INDEX "users_subscriptions_user_id_idx" ON "users_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "users_subscriptions_subscription_id_idx" ON "users_subscriptions"("subscription_id");

-- CreateIndex
CREATE INDEX "users_subscriptions_is_active_idx" ON "users_subscriptions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscriptions_user_id_subscription_id_key" ON "users_subscriptions"("user_id", "subscription_id");

-- CreateIndex
CREATE INDEX "payments_users_subscriptions_id_idx" ON "payments"("users_subscriptions_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE INDEX "payments_currency_id_idx" ON "payments"("currency_id");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_users_subscriptions_id_user_id_key" ON "payments"("users_subscriptions_id", "user_id");

-- CreateIndex
CREATE INDEX "emails_notification_id_idx" ON "emails"("notification_id");

-- CreateIndex
CREATE INDEX "emails_user_id_idx" ON "emails"("user_id");

-- CreateIndex
CREATE INDEX "emails_email_type_idx" ON "emails"("email_type");

-- CreateIndex
CREATE INDEX "emails_recipient_email_idx" ON "emails"("recipient_email");

-- CreateIndex
CREATE INDEX "emails_status_idx" ON "emails"("status");

-- CreateIndex
CREATE INDEX "emails_provider_idx" ON "emails"("provider");

-- CreateIndex
CREATE INDEX "emails_next_retry_at_idx" ON "emails"("next_retry_at");

-- CreateIndex
CREATE INDEX "emails_created_at_idx" ON "emails"("created_at");

-- CreateIndex
CREATE INDEX "sms_messages_phone_number_idx" ON "sms_messages"("phone_number");

-- CreateIndex
CREATE INDEX "sms_messages_sms_type_idx" ON "sms_messages"("sms_type");

-- CreateIndex
CREATE INDEX "sms_messages_created_at_idx" ON "sms_messages"("created_at");

-- CreateIndex
CREATE INDEX "points_transactions_created_at_idx" ON "points_transactions"("created_at");

-- CreateIndex
CREATE INDEX "points_transactions_user_id_created_at_idx" ON "points_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_notification_type_idx" ON "notifications"("notification_type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_push_status_idx" ON "notifications"("push_status");

-- CreateIndex
CREATE INDEX "notifications_device_id_idx" ON "notifications"("device_id");

-- CreateIndex
CREATE INDEX "notifications_email_id_idx" ON "notifications"("email_id");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "jobs_job_type_idx" ON "jobs"("job_type");

-- CreateIndex
CREATE INDEX "jobs_job_status_idx" ON "jobs"("job_status");

-- CreateIndex
CREATE INDEX "jobs_priority_idx" ON "jobs"("priority");

-- CreateIndex
CREATE INDEX "jobs_notification_id_idx" ON "jobs"("notification_id");

-- CreateIndex
CREATE INDEX "jobs_email_id_idx" ON "jobs"("email_id");

-- CreateIndex
CREATE INDEX "jobs_scheduled_at_idx" ON "jobs"("scheduled_at");

-- CreateIndex
CREATE INDEX "jobs_next_retry_at_idx" ON "jobs"("next_retry_at");

-- CreateIndex
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_uuid_key" ON "media"("uuid");

-- CreateIndex
CREATE INDEX "media_filename_idx" ON "media"("filename");

-- CreateIndex
CREATE INDEX "media_media_type_idx" ON "media"("media_type");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "media_file_hash_idx" ON "media"("file_hash");

-- CreateIndex
CREATE INDEX "media_uploaded_by_idx" ON "media"("uploaded_by");

-- CreateIndex
CREATE INDEX "media_folder_idx" ON "media"("folder");

-- CreateIndex
CREATE INDEX "media_is_active_idx" ON "media"("is_active");

-- CreateIndex
CREATE INDEX "media_is_public_idx" ON "media"("is_public");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at");

-- CreateIndex
CREATE INDEX "privacy_policy_slug_idx" ON "privacy_policy"("slug");

-- CreateIndex
CREATE INDEX "privacy_policy_is_active_idx" ON "privacy_policy"("is_active");

-- CreateIndex
CREATE INDEX "support_is_active_idx" ON "support"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- CreateIndex
CREATE INDEX "templates_name_idx" ON "templates"("name");

-- CreateIndex
CREATE INDEX "templates_type_idx" ON "templates"("type");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- AddForeignKey
ALTER TABLE "user_verification" ADD CONSTRAINT "user_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_password_reset" ADD CONSTRAINT "user_password_reset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_followers" ADD CONSTRAINT "user_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_followers" ADD CONSTRAINT "user_followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_topics" ADD CONSTRAINT "community_topics_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_topics" ADD CONSTRAINT "community_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_users" ADD CONSTRAINT "community_users_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_users" ADD CONSTRAINT "community_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_posts" ADD CONSTRAINT "user_posts_post_topic_id_fkey" FOREIGN KEY ("post_topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "user_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments_likes" ADD CONSTRAINT "comments_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_polls" ADD CONSTRAINT "user_polls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "user_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "user_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_vote_option_id_fkey" FOREIGN KEY ("vote_option_id") REFERENCES "poll_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_likes" ADD CONSTRAINT "poll_likes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "user_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_comments" ADD CONSTRAINT "poll_comments_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "user_polls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_comments" ADD CONSTRAINT "poll_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_comments" ADD CONSTRAINT "poll_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "poll_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_subscriptions" ADD CONSTRAINT "users_subscriptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_users_subscriptions_id_fkey" FOREIGN KEY ("users_subscriptions_id") REFERENCES "users_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
