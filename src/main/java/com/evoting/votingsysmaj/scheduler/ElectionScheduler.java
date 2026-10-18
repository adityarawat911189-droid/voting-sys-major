package com.evoting.votingsysmaj.scheduler;

import com.evoting.votingsysmaj.service.ElectionLifecycleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ElectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(ElectionScheduler.class);

    private final ElectionLifecycleService service;

    public ElectionScheduler(ElectionLifecycleService service) {
        this.service = service;
    }

    // Har 30 second me check karta hai. Pehle nomination, phir voting shuru, phir khatam.
    @Scheduled(initialDelay = 10_000, fixedDelay = 30_000)
    public void tick() {
        for (int id : service.dueToOpenNomination()) {
            run("nomination", id, () -> service.openNomination(id));
        }
        for (int id : service.dueToStart()) {
            run("start", id, () -> service.startVoting(id));
        }
        for (int id : service.dueToComplete()) {
            run("complete", id, () -> service.complete(id));
        }
    }

    private void run(String what, int id, Runnable task) {
        try {
            task.run();
        } catch (Exception e) {
            log.error("Election {} ({}) failed: {}", id, what, e.getMessage(), e);
        }
    }
}