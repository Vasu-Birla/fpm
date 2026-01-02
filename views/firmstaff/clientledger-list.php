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

        <!-- Start Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-0">
                    <a href="clientledger-list.php" class="text-dark"> <i class="ti ti-chevron-left me-1"></i>Client Ledger List </a>
                </h5>
            </div>
        </div>
        <!-- End Page Header -->

        <div class="table-responsive">
            <table id="clientledgerTable" class="table table-striped table-bordered table-nowrap">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Client Name</th>
                        <th>Total Invoiced</th>
                        <th>Total Paid</th>
                        <th>Balance</th>
                        <th>Statement</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>John Doe</td>
                        <td>$50,000</td>
                        <td>$40,000</td>
                        <td>$10,000</td>
                        <td><a href="#" class="btn btn-sm btn-info">View PDF</a></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->