<!-- Header Start -->
<?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
<?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- row start -->
        <div class="row justify-content-center">
            <div class="col-lg-12">
                
                <!-- page header start -->
                <div class="mb-4">
                    <h5 class="fw-bold mb-0 d-flex align-items-center"> 
                        <a href="researchassistant-list.php" class="text-dark"> 
                            <i class="ti ti-chevron-left me-1"></i>Edit Research Assistant
                        </a>
                    </h5>
                </div>
                <!-- page header end -->

                <!-- card start -->
                <form action="#" method="POST" enctype="multipart/form-data">
                    <div class="card">
                        <div class="card-body pb-0">
                            <div class="form">
                                <div class="row">

                                    <div class="col-md-6 mb-3">
                                        <label for="topic_keyword" class="form-label">Topic / Keyword</label>
                                        <input type="text" id="topic_keyword" name="topic_keyword" class="form-control" value="Criminal Procedure Act - Section 12" required>
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label for="assigned_by" class="form-label">Assigned By</label>
                                        <input type="text" id="assigned_by" name="assigned_by" class="form-control" value="Adv. Johnson" required>
                                    </div>

                                    <div class="col-md-12 mb-3">
                                        <label for="summary_findings" class="form-label">Summary / Findings</label>
                                        <textarea id="summary_findings" name="summary_findings" class="form-control" rows="4" required>Summary of legal precedents and procedural context...</textarea>
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label for="upload_report" class="form-label">Upload Report (PDF)</label>
                                        <input type="file" id="upload_report" name="upload_report" class="form-control" accept=".pdf">
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label for="related_case" class="form-label">Related Case</label>
                                        <input type="text" id="related_case" name="related_case" class="form-control" value="CASE-2025-012" required>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- card end -->

                    <div class="d-flex align-items-center justify-content-end mt-3">
                        <a href="researchassistant-list.php" class="btn btn-light me-2">Cancel</a>
                        <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">
                            Update Research Assistant
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <!-- row end -->               
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
<?php include('footer.php'); ?>
<!-- Footer End -->
