package com.goldenRun.NewTag.Repository;

import com.goldenRun.NewTag.entity.Report;
import com.goldenRun.NewTag.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface ReportRepository extends JpaRepository<Report, Integer> {

    
    List<Report> findByReporterUser(User reporterUser);
}