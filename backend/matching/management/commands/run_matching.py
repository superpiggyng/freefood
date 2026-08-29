from django.core.management.base import BaseCommand

from matching.services import allocate_ready_listings


class Command(BaseCommand):
    help = "Allocate ready marketplace listings by need score and request time."

    def handle(self, *args, **options):
        results = allocate_ready_listings()
        allocated = sum(result.allocated_count for result in results)
        declined = sum(result.declined_count for result in results)
        self.stdout.write(
            self.style.SUCCESS(
                f"Matched {len(results)} listing(s): {allocated} allocated, {declined} declined."
            )
        )
